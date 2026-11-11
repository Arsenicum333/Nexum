import { request } from './authApi'

export const channelsApi = {
  workspaces() {
    return request('/workspaces')
  },

  createWorkspace(name) {
    return request('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  },

  list(workspaceId) {
    return request(`/channels?workspaceId=${encodeURIComponent(workspaceId)}`)
  },

  create({ name, type, workspaceId }) {
    return request('/channels', {
      method: 'POST',
      body: JSON.stringify({ name, type, workspaceId })
    })
  },

  join(name, type = 'PUBLIC', workspaceId) {
    return request('/channels/join', {
      method: 'POST',
      body: JSON.stringify({ name, type, workspaceId })
    })
  },

  members(channelId) {
    return request(`/channels/${channelId}/members`)
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

  revoke(channelId, username) {
    return request(`/channels/${channelId}/revocations`, {
      method: 'POST',
      body: JSON.stringify({ username })
    })
  },

  kick(channelId, username) {
    return request(`/channels/${channelId}/kicks`, {
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
