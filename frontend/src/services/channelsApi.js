import { request } from './authApi'

export const channelsApi = {
  list() {
    return request('/channels')
  },

  create({ name, type }) {
    return request('/channels', {
      method: 'POST',
      body: JSON.stringify({ name, type })
    })
  },

  join(name) {
    return request('/channels/join', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  },

  leave(channelId) {
    return request(`/channels/${channelId}/leave`, { method: 'POST' })
  },

  delete(channelId) {
    return request(`/channels/${channelId}`, { method: 'DELETE' })
  },

  invite(channelId, username) {
    return request(`/channels/${channelId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ username })
    })
  },

  acceptInvitation(channelId) {
    return request(`/channels/${channelId}/invitations/accept`, {
      method: 'POST'
    })
  },

  declineInvitation(channelId) {
    return request(`/channels/${channelId}/invitations/decline`, {
      method: 'POST'
    })
  },

  messages(channelId) {
    return request(`/channels/${channelId}/messages`)
  },

  sendMessage(channelId, content) {
    return request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }
}
