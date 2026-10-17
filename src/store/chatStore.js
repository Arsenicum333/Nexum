import { reactive } from 'vue'

const generalHistory = Array.from({ length: 60 }, (_, index) => {
  const minutes = 8 * 60 + index * 3
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const minute = String(minutes % 60).padStart(2, '0')
  const authors = ['Alex', 'Mariya', 'John']

  return {
    id: `general-history-${index + 1}`,
    author: authors[index % authors.length],
    text: `History message ${index + 1}: the Nexum team is discussing the next release.`,
    time: `${hours}:${minute}`
  }
})

export const chatStore = reactive({
  activeChannel: 'gen',
  membersDialogOpen: false,

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
      ...generalHistory,
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

  openMembersDialog() {
    this.membersDialogOpen = true
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
    const channel = {
      id,
      name,
      private: isPrivate,
      unread: 0,
      owner: 'me'
    }
    this.textChannels.push(channel)
    this.channelMessages[id] = []
    this.activeChannel = id
    return channel
  },

  removeActiveChannel() {
    const currentIndex = this.textChannels.findIndex(
      channel => channel.id === this.activeChannel
    )
    if (currentIndex === -1 || this.textChannels.length === 1) return null

    const nextChannel =
      this.textChannels[currentIndex === 0 ? 1 : currentIndex - 1]
    const removedChannel = this.activeChannel
    this.textChannels.splice(currentIndex, 1)
    delete this.channelMessages[removedChannel]
    this.activeChannel = nextChannel.id
    return nextChannel
  }
})
