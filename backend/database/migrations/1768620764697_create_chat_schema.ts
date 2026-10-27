import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableNames = {
    notificationSettings: 'notification_settings',
    channels: 'channels',
    channelMembers: 'channel_members',
    messages: 'messages',
    messageMentions: 'message_mentions',
    invitations: 'invitations',
    kickVotes: 'kick_votes',
    channelBans: 'channel_bans',
  }

  async up() {
    this.schema.createTable(this.tableNames.notificationSettings, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('user_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('notification_scope', 16).notNullable().defaultTo('ALL')
      table.boolean('browser_notifications').notNullable().defaultTo(true)
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.tableNames.channels, (table) => {
      table.bigIncrements('id')
      table.string('name', 40).notNullable()
      table.string('channel_type', 8).notNullable()
      table
        .bigInteger('owner_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('last_activity_at').notNullable().defaultTo(this.now())
      table.timestamp('deleted_at').nullable()
    })

    this.schema.createTable(this.tableNames.channelMembers, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .bigInteger('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('role', 16).notNullable().defaultTo('MEMBER')
      table.string('membership_status', 16).notNullable().defaultTo('ACTIVE')
      table.timestamp('joined_at').notNullable().defaultTo(this.now())
      table.timestamp('left_at').nullable()
      table.unique(['channel_id', 'user_id'])
    })

    this.schema.createTable(this.tableNames.messages, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .bigInteger('author_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.text('content').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('edited_at').nullable()
      table.timestamp('deleted_at').nullable()
    })

    this.schema.createTable(this.tableNames.messageMentions, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('message_id')
        .notNullable()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')
      table
        .bigInteger('mentioned_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.unique(['message_id', 'mentioned_user_id'])
    })

    this.schema.createTable(this.tableNames.invitations, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .bigInteger('inviter_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .bigInteger('invitee_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('status', 16).notNullable().defaultTo('PENDING')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('responded_at').nullable()
    })

    this.schema.createTable(this.tableNames.kickVotes, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .bigInteger('target_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .bigInteger('voter_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.unique(['channel_id', 'target_user_id', 'voter_user_id'])
    })

    this.schema.createTable(this.tableNames.channelBans, (table) => {
      table.bigIncrements('id')
      table
        .bigInteger('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .bigInteger('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('reason', 255).nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('revoked_at').nullable()
      table
        .bigInteger('created_by')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
    })

    this.schema.raw(
      "ALTER TABLE notification_settings ADD CONSTRAINT notification_settings_scope_check CHECK (notification_scope IN ('ALL', 'MENTIONS_ONLY'))"
    )
    this.schema.raw(
      "ALTER TABLE channels ADD CONSTRAINT channels_type_check CHECK (channel_type IN ('PUBLIC', 'PRIVATE'))"
    )
    this.schema.raw(
      "ALTER TABLE channel_members ADD CONSTRAINT channel_members_role_check CHECK (role IN ('OWNER', 'MEMBER'))"
    )
    this.schema.raw(
      "ALTER TABLE channel_members ADD CONSTRAINT channel_members_status_check CHECK (membership_status IN ('ACTIVE', 'LEFT', 'KICKED'))"
    )
    this.schema.raw(
      "ALTER TABLE invitations ADD CONSTRAINT invitations_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'))"
    )
    this.schema.raw(
      'ALTER TABLE invitations ADD CONSTRAINT invitations_different_users_check CHECK (inviter_id <> invitee_id)'
    )
    this.schema.raw(
      'ALTER TABLE kick_votes ADD CONSTRAINT kick_votes_different_users_check CHECK (target_user_id <> voter_user_id)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX channels_active_name_unique ON channels (name) WHERE deleted_at IS NULL'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX channel_bans_active_user_unique ON channel_bans (channel_id, user_id) WHERE revoked_at IS NULL'
    )
  }

  async down() {
    this.schema.dropTable(this.tableNames.channelBans)
    this.schema.dropTable(this.tableNames.kickVotes)
    this.schema.dropTable(this.tableNames.invitations)
    this.schema.dropTable(this.tableNames.messageMentions)
    this.schema.dropTable(this.tableNames.messages)
    this.schema.dropTable(this.tableNames.channelMembers)
    this.schema.dropTable(this.tableNames.channels)
    this.schema.dropTable(this.tableNames.notificationSettings)
  }
}
