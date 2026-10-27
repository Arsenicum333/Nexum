import { reactive } from 'vue'

export const userStore = reactive({
  firstName: 'John',
  lastName: 'Doe',
  email: 'you@example.com',
  username: 'johndoe',
  displayName: 'John',
  status: 'online',
  notificationMode: 'all',
  authenticated:
    typeof window !== 'undefined' &&
    Boolean(localStorage.getItem('nexum:access-token')),

  get shownName() {
    return this.displayName.trim() || this.username
  },

  update(data) {
    Object.assign(this, data)
  },

  setAuthenticated(value) {
    this.authenticated = value
    if (typeof window === 'undefined') return

    if (!value) localStorage.removeItem('nexum:access-token')
  },

  clear() {
    this.firstName = ''
    this.lastName = ''
    this.email = ''
    this.username = ''
    this.displayName = ''
    this.authenticated = false
  }
})
