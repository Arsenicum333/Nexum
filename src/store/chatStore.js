import { reactive } from 'vue'

export const chatStore = reactive({
  activeChannel: 'gen',

  textChannels: [
    { id: 'gen', name: 'general', private: false, unread: 0, owner: 'me' },
    {
      id: 'ann',
      name: 'announcements',
      private: false,
      unread: 2,
      owner: 'me'
    },
    { id: 'dev', name: 'developers', private: true, unread: 0, owner: 'me' },
    { id: 'random', name: 'random', private: false, unread: 0, owner: 'me' },
    {
      id: 'design',
      name: 'design-team',
      private: true,
      unread: 0,
      owner: 'mariya',
      invited: true
    }
  ],

  channelMessages: {
    gen: [
      {
        id: 1,
        author: 'Alex',
        text: 'Welcome to Nexum General Chat!',
        time: '12:30'
      },
      {
        id: 2,
        author: 'Mariya',
        text: 'Hello everyone! How is the development going?',
        time: '12:32'
      }
    ],
    ann: [
      {
        id: 3,
        author: 'Alex',
        text: 'The first prototype review is on Friday.',
        time: '09:15'
      }
    ],
    dev: [
      {
        id: 4,
        author: 'Mariya',
        text: 'Private channel for the frontend team.',
        time: '11:05'
      }
    ],
    random: [],
    design: []
  },

  get sortedChannels() {
    return [...this.textChannels].sort(
      (first, second) => Number(Boolean(second.invited)) - Number(Boolean(first.invited))
    )
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

  addMessage(text) {
    const messages = this.channelMessages[this.activeChannel]
    if (!messages || !text.trim()) return

    messages.push({
      id: Date.now(),
      author: 'me',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    })
  },

  createChannel(name, isPrivate) {
    const id = `${name}-${Date.now()}`
    this.textChannels.push({
      id,
      name,
      private: isPrivate,
      unread: 0,
      owner: 'me'
    })
    this.channelMessages[id] = []
    this.activeChannel = id
  },

  removeActiveChannel() {
    const currentIndex = this.textChannels.findIndex(
      channel => channel.id === this.activeChannel
    )
    if (currentIndex === -1 || this.textChannels.length === 1) return

    const nextChannel =
      this.textChannels[currentIndex === 0 ? 1 : currentIndex - 1]
    const removedChannel = this.activeChannel
    this.textChannels.splice(currentIndex, 1)
    delete this.channelMessages[removedChannel]
    this.activeChannel = nextChannel.id
  }
})
