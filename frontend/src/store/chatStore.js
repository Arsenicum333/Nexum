import { reactive } from 'vue'
import { channelsApi } from '@/services/channelsApi'

export const chatStore = reactive({
  activeChannel: '',
  membersDialogOpen: false,
  workspaceRailVisible: true,
  workspaces: [],
  textChannels: [],
  channelMessages: {},
  channelMembers: {},

  get sortedChannels() {
    return [...this.textChannels].sort(
      (first, second) =>
        Number(Boolean(second.invited)) - Number(Boolean(first.invited)) ||
        first.name.localeCompare(second.name)
    )
  },

  async loadChannels() {
    this.textChannels = await channelsApi.list()
    this.textChannels.forEach(channel => {
      if (!this.channelMessages[channel.id])
        this.channelMessages[channel.id] = []
    })
    if (!this.textChannels.some(channel => channel.id === this.activeChannel)) {
      this.activeChannel =
        this.textChannels.find(channel => !channel.invited)?.id || ''
    }
    return this.textChannels
  },

  getMembers(currentUser) {
    if (this.channelMembers[this.activeChannel]) {
      return this.channelMembers[this.activeChannel]
    }

    return [
      {
        id: 'me',
        name: currentUser.shownName,
        username: currentUser.username,
        status: currentUser.status
      }
    ]
  },

  async loadMembers(channelId = this.activeChannel) {
    if (!channelId) return []
    const members = await channelsApi.members(channelId)
    this.channelMembers[channelId] = members.map(member => ({
      id: String(member.id),
      name: member.displayName,
      username: member.username,
      status: member.status.toLowerCase(),
      role: member.role
    }))
    return this.channelMembers[channelId]
  },

  openMembersDialog() {
    this.membersDialogOpen = true
  },

  async addMessage(text) {
    const channelId = this.activeChannel
    const channel = this.textChannels.find(item => item.id === channelId)
    if (!channel || channel.invited) {
      throw new Error('Join a channel before sending a message')
    }

    const content = text.trim()
    if (!content) return

    const message = await channelsApi.sendMessage(channelId, content)
    if (!this.channelMessages[channelId]) this.channelMessages[channelId] = []
    this.channelMessages[channelId].push({
      ...message,
      time: new Date(message.time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      author: 'me'
    })
  },

  async loadMessages(channelId) {
    const messages = await channelsApi.messages(channelId)
    this.channelMessages[channelId] = messages.map(message => ({
      ...message,
      time: new Date(message.time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }))
  },

  createWorkspace(name) {
    const workspace = { id: `workspace-${Date.now()}`, name }
    this.workspaces.push(workspace)
    return workspace
  },

  async createChannel(name, isPrivate) {
    const channel = await channelsApi.create({
      name,
      type: isPrivate ? 'PRIVATE' : 'PUBLIC'
    })
    this.textChannels.push(channel)
    this.channelMessages[channel.id] = []
    this.activeChannel = channel.id
    return channel
  },

  async joinChannel(name, isPrivate = false) {
    const channel = await channelsApi.join(
      name,
      isPrivate ? 'PRIVATE' : 'PUBLIC'
    )
    if (!this.textChannels.some(item => item.id === channel.id)) {
      this.textChannels.push(channel)
    }
    if (!this.channelMessages[channel.id]) this.channelMessages[channel.id] = []
    this.activeChannel = channel.id
    return channel
  },

  async leaveActiveChannel() {
    const removedChannel = this.activeChannel
    if (!removedChannel) return null
    await channelsApi.leave(removedChannel)
    delete this.channelMessages[removedChannel]
    this.activeChannel = ''
    await this.loadChannels()
    return (
      this.textChannels.find(channel => channel.id === this.activeChannel) ||
      null
    )
  },

  async deleteActiveChannel() {
    const removedChannel = this.activeChannel
    if (!removedChannel) return null
    await channelsApi.delete(removedChannel)
    delete this.channelMessages[removedChannel]
    this.activeChannel = ''
    await this.loadChannels()
    return (
      this.textChannels.find(channel => channel.id === this.activeChannel) ||
      null
    )
  },

  async acceptInvitation(channel) {
    await channelsApi.acceptInvitation(channel.id)
    await this.loadChannels()
    const acceptedChannel = this.textChannels.find(
      item => item.id === channel.id
    )
    if (acceptedChannel) this.activeChannel = acceptedChannel.id
    return acceptedChannel || null
  },

  async declineInvitation(channel) {
    await channelsApi.declineInvitation(channel.id)
    this.textChannels = this.textChannels.filter(item => item.id !== channel.id)
    if (this.activeChannel === channel.id) {
      this.activeChannel =
        this.textChannels.find(item => !item.invited)?.id || ''
    }
  },

  async inviteMember(username) {
    const channel = this.textChannels.find(
      item => item.id === this.activeChannel
    )
    if (!channel) throw new Error('Open a channel first')
    return channelsApi.invite(channel.id, username)
  },

  async revokeMember(username) {
    const channel = this.textChannels.find(
      item => item.id === this.activeChannel
    )
    if (!channel) throw new Error('Open a channel first')
    return channelsApi.revoke(channel.id, username)
  },

  async kickMember(username) {
    const channel = this.textChannels.find(
      item => item.id === this.activeChannel
    )
    if (!channel) throw new Error('Open a channel first')
    return channelsApi.kick(channel.id, username)
  },

  async quitChannel() {
    if (!this.activeChannel) throw new Error('Open a channel first')
    return this.deleteActiveChannel()
  }
})
