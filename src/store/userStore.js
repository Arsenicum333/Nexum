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
    localStorage.getItem('nexum:authenticated') === 'true',

  get shownName() {
    return this.displayName.trim() || this.username
  },

  update(data) {
    Object.assign(this, data)
  },

  setAuthenticated(value) {
    this.authenticated = value
    if (typeof window === 'undefined') return

    if (value) localStorage.setItem('nexum:authenticated', 'true')
    else localStorage.removeItem('nexum:authenticated')
  }
})
