import { reactive } from 'vue'
import { channelsApi } from '@/services/channelsApi'

export const chatStore = reactive({
  activeChannel: '',
  membersDialogOpen: false,
  workspaceRailVisible: true,
  workspaces: [],

  textChannels: [],

  channelMessages: {},

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
    return [
      {
        id: 'me',
        name: currentUser.shownName,
        username: currentUser.username,
        status: currentUser.status
      },
      { id: 'alex', name: 'Alex', username: 'alex', status: 'online' },
      { id: 'mariya', name: 'Mariya', username: 'mariya', status: 'away' }
    ]
  },

  openMembersDialog() {
    this.membersDialogOpen = true
  },

  async addMessage(text) {
    const messages = this.channelMessages[this.activeChannel]
    if (!messages || !text.trim()) return

    const message = await channelsApi.sendMessage(
      this.activeChannel,
      text.trim()
    )
    messages.push({
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

  async joinChannel(name) {
    const channel = await channelsApi.join(name)
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
    if (!channel) return
    return channelsApi.invite(channel.id, username)
  }
})
