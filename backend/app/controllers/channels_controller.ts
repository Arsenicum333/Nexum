import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import {
  createChannelValidator,
  createMessageValidator,
  inviteChannelMemberValidator,
  joinChannelValidator,
} from '#validators/channel'

const CHANNEL_LIFETIME_DAYS = 30
const PG_UNIQUE_VIOLATION = '23505'
const KICK_VOTES_REQUIRED = 3

export default class ChannelsController {
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    await this.removeExpiredChannels()

    const memberships = await db
      .from('channels')
      .join('channel_members', 'channel_members.channel_id', 'channels.id')
      .where('channel_members.user_id', userId)
      .where('channel_members.membership_status', 'ACTIVE')
      .whereNull('channels.deleted_at')
      .select('channels.id', 'channels.name', 'channels.channel_type', 'channels.owner_id')

    const invitations = await db
      .from('invitations')
      .join('channels', 'channels.id', 'invitations.channel_id')
      .where('invitations.invitee_id', userId)
      .where('invitations.status', 'PENDING')
      .whereNull('channels.deleted_at')
      .select(
        'channels.id',
        'channels.name',
        'channels.channel_type',
        'channels.owner_id',
        'invitations.id as invitation_id'
      )

    const channels = new Map<string, Record<string, unknown>>()
    for (const channel of memberships) {
      channels.set(String(channel.id), this.serializeChannel(channel, userId))
    }
    for (const channel of invitations) {
      const id = String(channel.id)
      if (!channels.has(id)) {
        channels.set(id, {
          ...this.serializeChannel(channel, userId),
          invited: true,
          invitationId: String(channel.invitation_id),
        })
      }
    }

    return serialize([...channels.values()])
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const { name, type } = await request.validateUsing(createChannelValidator)
    await this.removeExpiredChannels()

    const existing = await db.from('channels').where('name', name).whereNull('deleted_at').first()
    if (existing) {
      return response.conflict({
        message: 'A channel with this name already exists',
      })
    }

    try {
      const channel = await db.transaction(async (trx) => {
        const [createdChannel] = await trx
          .insertQuery()
          .table('channels')
          .insert({
            name,
            channel_type: type,
            owner_id: userId,
            last_activity_at: new Date(),
          })
          .returning(['id', 'name', 'channel_type', 'owner_id'])

        await trx.insertQuery().table('channel_members').insert({
          channel_id: createdChannel.id,
          user_id: userId,
          role: 'OWNER',
          membership_status: 'ACTIVE',
          joined_at: new Date(),
        })

        return createdChannel
      })

      return response.created(await serialize(this.serializeChannel(channel, userId)))
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return response.conflict({
          message: 'A channel with this name already exists',
        })
      }
      throw error
    }
  }

  async joinPublic({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const { name, type } = await request.validateUsing(joinChannelValidator)

    await this.removeExpiredChannels()
    let channel = await db.from('channels').where('name', name).whereNull('deleted_at').first()
    if (!channel) {
      try {
        const [createdChannel] = await db.transaction(async (trx) => {
          const [created] = await trx
            .insertQuery()
            .table('channels')
            .insert({
              name,
              channel_type: type || 'PUBLIC',
              owner_id: userId,
              last_activity_at: new Date(),
            })
            .returning(['id', 'name', 'channel_type', 'owner_id'])

          await trx.insertQuery().table('channel_members').insert({
            channel_id: created.id,
            user_id: userId,
            role: 'OWNER',
            membership_status: 'ACTIVE',
            joined_at: new Date(),
          })
          return [created]
        })

        return response.created(
          await serialize({
            ...this.serializeChannel(createdChannel, userId),
            created: true,
          })
        )
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          return response.conflict({
            message: 'A channel with this name already exists',
          })
        }
        throw error
      }
    }

    const membership = await db
      .from('channel_members')
      .where('channel_id', channel.id)
      .where('user_id', userId)
      .first()
    const activeBan = await db
      .from('channel_bans')
      .where('channel_id', channel.id)
      .where('user_id', userId)
      .whereNull('revoked_at')
      .first()
    if (activeBan) {
      return response.forbidden({
        message: 'You were permanently removed from this channel',
      })
    }
    if (membership?.membership_status === 'KICKED') {
      return response.forbidden({
        message: 'You were removed from this channel',
      })
    }
    if (membership?.membership_status === 'ACTIVE') {
      return serialize(this.serializeChannel(channel, userId))
    }
    if (channel.channel_type === 'PRIVATE') {
      return response.forbidden({
        message: 'You need an invitation to join this private channel',
      })
    }

    if (membership) {
      await db.from('channel_members').where('id', membership.id).update({
        membership_status: 'ACTIVE',
        role: 'MEMBER',
        joined_at: new Date(),
        left_at: null,
      })
    } else {
      await db.insertQuery().table('channel_members').insert({
        channel_id: channel.id,
        user_id: userId,
        role: 'MEMBER',
        membership_status: 'ACTIVE',
        joined_at: new Date(),
      })
    }

    channel = await db
      .from('channels')
      .where('id', channel.id)
      .select('id', 'name', 'channel_type', 'owner_id')
      .first()
    return serialize(this.serializeChannel(channel, userId))
  }

  async leave({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })
    if (String(channel.owner_id) === userId) {
      return response.forbidden({
        message: 'The channel owner cannot leave; use /quit to close it',
      })
    }

    const updated = await db.transaction(async (trx) => {
      const membershipUpdated = await trx
        .from('channel_members')
        .where('channel_id', channelId)
        .where('user_id', userId)
        .where('membership_status', 'ACTIVE')
        .update({ membership_status: 'LEFT', left_at: new Date() })

      if (membershipUpdated) {
        await trx
          .from('kick_votes')
          .where('channel_id', channelId)
          .where('voter_user_id', userId)
          .delete()
      }

      return membershipUpdated
    })

    if (!updated) {
      return response.forbidden({
        message: 'You are not a member of this channel',
      })
    }

    return serialize({ message: 'You left the channel' })
  }

  async destroy({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })
    if (String(channel.owner_id) !== userId) {
      return response.forbidden({
        message: 'Only the channel creator can delete it',
      })
    }

    await db.from('channels').where('id', channelId).update({ deleted_at: new Date() })
    return serialize({ message: 'Channel deleted' })
  }

  async invite({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return
    const { username } = await request.validateUsing(inviteChannelMemberValidator)

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })

    const membership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .where('membership_status', 'ACTIVE')
      .first()
    if (!membership) {
      return response.forbidden({
        message: 'Only channel members can invite users',
      })
    }
    const isOwner = String(channel.owner_id) === userId || membership.role === 'OWNER'
    if (channel.channel_type === 'PRIVATE' && !isOwner) {
      return response.forbidden({
        message: 'Only the channel owner can invite users to a private channel',
      })
    }

    const invitee = await db
      .from('users')
      .whereRaw('LOWER(username) = LOWER(?)', [username])
      .first()
    if (!invitee) return response.notFound({ message: 'User not found' })
    if (String(invitee.id) === userId) {
      return response.unprocessableEntity({
        message: 'You cannot invite yourself',
      })
    }

    const existingMembership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', String(invitee.id))
      .first()
    if (existingMembership?.membership_status === 'ACTIVE') {
      return response.conflict({
        message: 'This user is already a channel member',
      })
    }
    const activeBan = await db
      .from('channel_bans')
      .where('channel_id', channelId)
      .where('user_id', String(invitee.id))
      .whereNull('revoked_at')
      .first()
    if (activeBan || existingMembership?.membership_status === 'KICKED') {
      if (!activeBan || !isOwner) {
        return response.forbidden({
          message: 'Only the channel owner can restore this user',
        })
      }

      await db.transaction(async (trx) => {
        await trx.from('channel_bans').where('id', activeBan.id).update({ revoked_at: new Date() })
        if (existingMembership) {
          await trx.from('channel_members').where('id', existingMembership.id).update({
            membership_status: 'ACTIVE',
            role: 'MEMBER',
            joined_at: new Date(),
            left_at: null,
          })
        } else {
          await trx
            .insertQuery()
            .table('channel_members')
            .insert({
              channel_id: channelId,
              user_id: String(invitee.id),
              role: 'MEMBER',
              membership_status: 'ACTIVE',
              joined_at: new Date(),
            })
        }
        await trx
          .from('invitations')
          .where('channel_id', channelId)
          .where('invitee_id', String(invitee.id))
          .where('status', 'PENDING')
          .update({ status: 'ACCEPTED', responded_at: new Date() })
        await trx
          .from('kick_votes')
          .where('channel_id', channelId)
          .where('target_user_id', String(invitee.id))
          .delete()
      })

      return serialize({
        message: `Access restored for @${invitee.username}`,
        username: invitee.username,
        restored: true,
      })
    }

    const pendingInvitation = await db
      .from('invitations')
      .where('channel_id', channelId)
      .where('invitee_id', String(invitee.id))
      .where('status', 'PENDING')
      .first()
    if (pendingInvitation) {
      return response.conflict({
        message: 'This user already has a pending invitation',
      })
    }

    const [invitation] = await db
      .insertQuery()
      .table('invitations')
      .insert({
        channel_id: channelId,
        inviter_id: userId,
        invitee_id: String(invitee.id),
        status: 'PENDING',
      })
      .returning(['id'])

    return response.created(
      await serialize({
        invitationId: String(invitation.id),
        username: invitee.username,
      })
    )
  }

  async revoke({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return
    const { username } = await request.validateUsing(inviteChannelMemberValidator)

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })
    if (channel.channel_type !== 'PRIVATE' || String(channel.owner_id) !== userId) {
      return response.forbidden({
        message: 'Only the owner can revoke access to a private channel',
      })
    }

    const target = await db.from('users').whereRaw('LOWER(username) = LOWER(?)', [username]).first()
    if (!target) return response.notFound({ message: 'User not found' })
    if (String(target.id) === userId) {
      return response.unprocessableEntity({
        message: 'The channel owner cannot revoke their own access',
      })
    }

    const membership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', String(target.id))
      .where('membership_status', 'ACTIVE')
      .first()
    const pendingInvitation = await db
      .from('invitations')
      .where('channel_id', channelId)
      .where('invitee_id', String(target.id))
      .where('status', 'PENDING')
      .first()
    if (!membership && !pendingInvitation) {
      return response.notFound({
        message: 'User is not a member and has no pending invitation',
      })
    }

    await db.transaction(async (trx) => {
      if (membership) {
        await trx
          .from('channel_members')
          .where('id', membership.id)
          .update({ membership_status: 'LEFT', left_at: new Date() })
        await trx
          .from('kick_votes')
          .where('channel_id', channelId)
          .where('voter_user_id', String(target.id))
          .delete()
      }
      await trx
        .from('invitations')
        .where('channel_id', channelId)
        .where('invitee_id', String(target.id))
        .where('status', 'PENDING')
        .update({ status: 'REVOKED', responded_at: new Date() })
    })

    return serialize({ message: `Access revoked for @${target.username}` })
  }

  async kick({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return
    const { username } = await request.validateUsing(inviteChannelMemberValidator)

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })

    const actorMembership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .where('membership_status', 'ACTIVE')
      .first()
    if (!actorMembership) {
      return response.forbidden({
        message: 'Only channel members can kick users',
      })
    }

    const target = await db.from('users').whereRaw('LOWER(username) = LOWER(?)', [username]).first()
    if (!target) return response.notFound({ message: 'User not found' })
    if (String(target.id) === userId) {
      return response.unprocessableEntity({
        message: 'You cannot kick yourself',
      })
    }
    if (String(target.id) === String(channel.owner_id)) {
      return response.forbidden({ message: 'The channel owner cannot be kicked' })
    }

    const targetMembership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', String(target.id))
      .where('membership_status', 'ACTIVE')
      .first()
    if (!targetMembership) {
      return response.notFound({
        message: 'The user is not an active channel member',
      })
    }

    const isOwner = String(channel.owner_id) === userId || actorMembership.role === 'OWNER'
    if (!isOwner && channel.channel_type !== 'PUBLIC') {
      return response.forbidden({
        message: 'Only the channel owner can kick users from a private channel',
      })
    }

    const now = new Date()
    const outcome = await db.transaction(async (trx) => {
      await trx.from('channels').where('id', channelId).forUpdate().first()

      if (!isOwner) {
        const existingVote = await trx
          .from('kick_votes')
          .where('channel_id', channelId)
          .where('target_user_id', String(target.id))
          .where('voter_user_id', userId)
          .first()
        if (existingVote) {
          return { voteCount: 0, banned: false, alreadyVoted: true }
        }
        await trx
          .insertQuery()
          .table('kick_votes')
          .insert({
            channel_id: channelId,
            target_user_id: String(target.id),
            voter_user_id: userId,
          })
        const votes = await trx
          .from('kick_votes')
          .join('channel_members', 'channel_members.user_id', 'kick_votes.voter_user_id')
          .where('kick_votes.channel_id', channelId)
          .where('kick_votes.target_user_id', String(target.id))
          .where('channel_members.channel_id', channelId)
          .where('channel_members.membership_status', 'ACTIVE')
          .count('* as total')
          .first()
        const voteCount = Number(votes?.total || 0)
        if (voteCount < KICK_VOTES_REQUIRED) {
          return { voteCount, banned: false }
        }
      }

      const activeBan = await trx
        .from('channel_bans')
        .where('channel_id', channelId)
        .where('user_id', String(target.id))
        .whereNull('revoked_at')
        .first()
      if (activeBan) {
        await trx.from('channel_bans').where('id', activeBan.id).update({
          reason: 'Kicked from channel',
          created_by: userId,
        })
      } else {
        await trx
          .insertQuery()
          .table('channel_bans')
          .insert({
            channel_id: channelId,
            user_id: String(target.id),
            reason: 'Kicked from channel',
            created_by: userId,
          })
      }
      await trx
        .from('channel_members')
        .where('id', targetMembership.id)
        .update({ membership_status: 'KICKED', left_at: now })
      await trx
        .from('kick_votes')
        .where('channel_id', channelId)
        .where('voter_user_id', String(target.id))
        .delete()
      await trx
        .from('invitations')
        .where('channel_id', channelId)
        .where('invitee_id', String(target.id))
        .where('status', 'PENDING')
        .update({ status: 'REVOKED', responded_at: now })
      await trx
        .from('kick_votes')
        .where('channel_id', channelId)
        .where('target_user_id', String(target.id))
        .delete()

      return { voteCount: KICK_VOTES_REQUIRED, banned: true }
    })

    if ('alreadyVoted' in outcome && outcome.alreadyVoted) {
      return response.conflict({
        message: `You have already voted to kick @${target.username}`,
      })
    }

    if (outcome.banned) {
      return serialize({
        message: `@${target.username} was permanently removed from the channel`,
        votes: outcome.voteCount,
        banned: true,
      })
    }
    return serialize({
      message: `Kick vote recorded for @${target.username}`,
      votes: outcome.voteCount,
      requiredVotes: KICK_VOTES_REQUIRED,
      banned: false,
    })
  }

  async acceptInvitation({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })

    const invitation = await db
      .from('invitations')
      .where('channel_id', channelId)
      .where('invitee_id', userId)
      .where('status', 'PENDING')
      .first()
    if (!invitation) {
      return response.notFound({
        message: 'Pending channel invitation not found',
      })
    }

    const activeBan = await db
      .from('channel_bans')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .whereNull('revoked_at')
      .first()
    if (activeBan) {
      return response.forbidden({
        message: 'The channel owner must restore your access first',
      })
    }

    const membership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()
    if (membership?.membership_status === 'KICKED') {
      return response.forbidden({
        message: 'You were removed from this channel',
      })
    }

    await db.transaction(async (trx) => {
      if (membership && membership.membership_status !== 'ACTIVE') {
        await trx.from('channel_members').where('id', membership.id).update({
          membership_status: 'ACTIVE',
          role: 'MEMBER',
          joined_at: new Date(),
          left_at: null,
        })
      } else if (!membership) {
        await trx.insertQuery().table('channel_members').insert({
          channel_id: channelId,
          user_id: userId,
          role: 'MEMBER',
          membership_status: 'ACTIVE',
          joined_at: new Date(),
        })
      }

      await trx
        .from('invitations')
        .where('id', invitation.id)
        .update({ status: 'ACCEPTED', responded_at: new Date() })
    })

    return serialize({ message: 'Invitation accepted' })
  }

  async declineInvitation({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return

    const updated = await db
      .from('invitations')
      .where('channel_id', channelId)
      .where('invitee_id', userId)
      .where('status', 'PENDING')
      .update({ status: 'DECLINED', responded_at: new Date() })

    if (!updated) {
      return response.notFound({
        message: 'Pending channel invitation not found',
      })
    }
    return serialize({ message: 'Invitation declined' })
  }

  async messages({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })

    const membership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .where('membership_status', 'ACTIVE')
      .first()
    if (!membership) {
      return response.forbidden({
        message: 'You are not a member of this channel',
      })
    }

    const messages = await db
      .from('messages')
      .join('users', 'users.id', 'messages.author_id')
      .where('messages.channel_id', channelId)
      .whereNull('messages.deleted_at')
      .orderBy('messages.created_at', 'desc')
      .limit(100)
      .select(
        'messages.id',
        'messages.content',
        'messages.created_at',
        'messages.author_id',
        'users.display_name'
      )

    return serialize(
      messages.reverse().map((message) => ({
        id: String(message.id),
        text: message.content,
        time: new Date(message.created_at).toISOString(),
        author: String(message.author_id) === userId ? 'me' : message.display_name,
        authorId: String(message.author_id),
      }))
    )
  }

  async sendMessage({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const userId = String(user.id)
    const channelId = this.getChannelId(params.id, response)
    if (!channelId) return
    const { content } = await request.validateUsing(createMessageValidator)

    await this.removeExpiredChannels()
    const channel = await db.from('channels').where('id', channelId).whereNull('deleted_at').first()
    if (!channel) return response.notFound({ message: 'Channel not found' })

    const membership = await db
      .from('channel_members')
      .where('channel_id', channelId)
      .where('user_id', userId)
      .where('membership_status', 'ACTIVE')
      .first()
    if (!membership) {
      return response.forbidden({
        message: 'You are not a member of this channel',
      })
    }

    const now = new Date()
    const [message] = await db.transaction(async (trx) => {
      const [createdMessage] = await trx
        .insertQuery()
        .table('messages')
        .insert({ channel_id: channelId, author_id: userId, content })
        .returning(['id', 'content', 'created_at'])

      await trx.from('channels').where('id', channelId).update({ last_activity_at: now })

      return [createdMessage]
    })

    return response.created(
      await serialize({
        id: String(message.id),
        text: message.content,
        time: new Date(message.created_at).toISOString(),
        author: user.displayName,
        authorId: userId,
      })
    )
  }

  private serializeChannel(
    channel: {
      id: string | number | bigint
      name: string
      channel_type: string
      owner_id: string | number | bigint
    },
    userId: string | number | bigint
  ) {
    return {
      id: String(channel.id),
      name: channel.name,
      private: channel.channel_type === 'PRIVATE',
      owner: String(channel.owner_id) === String(userId) ? 'me' : String(channel.owner_id),
      ownerId: String(channel.owner_id),
      invited: false,
    }
  }

  private getChannelId(value: unknown, response: HttpContext['response']) {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
      response.badRequest({ message: 'Invalid channel ID' })
      return null
    }
    return value
  }

  private isUniqueViolation(error: unknown) {
    return (error as { code?: string } | null)?.code === PG_UNIQUE_VIOLATION
  }

  private async removeExpiredChannels() {
    const expiresBefore = new Date(Date.now() - CHANNEL_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
    await db
      .from('channels')
      .whereNull('deleted_at')
      .where('last_activity_at', '<=', expiresBefore)
      .update({ deleted_at: new Date() })
  }
}
