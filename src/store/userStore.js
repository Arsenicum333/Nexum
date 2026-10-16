import { reactive } from 'vue'

export const userStore = reactive({
  firstName: 'John',
  lastName: 'Doe',
  email: 'you@example.com',
  username: 'johndoe',
  displayName: 'John',
  status: 'online',

  get shownName() {
    return this.displayName.trim() || this.username
  },

  update(data) {
    Object.assign(this, data)
  }
})
