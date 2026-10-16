<template>
  <div class="command-bar q-pr-md row items-center">
    <q-list class="account-slot">
      <UserMenu />
    </q-list>
    <q-separator vertical class="self-stretch" />
    <q-input
      ref="commandInput"
      v-model="command"
      dense
      outlined
      autofocus
      placeholder="Write a message or type /help"
      class="command-input col q-ml-md"
      @keyup.enter="submitCommand"
    >
      <template #prepend>
        <q-icon name="terminal" color="primary" />
      </template>
      <template #append>
        <q-btn
          round
          flat
          dense
          icon="send"
          color="primary"
          aria-label="Send command"
          @click="submitCommand"
        />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import UserMenu from '@/components/UserMenu.vue'
import { chatStore } from '@/store/chatStore'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const command = ref('')
const commandInput = ref(null)

function submitCommand() {
  const value = command.value.trim()
  if (!value) return

  if (value.startsWith('/')) {
    runCommand(value)
  } else if (route.path.startsWith('/chat/')) {
    chatStore.addMessage(value)
  } else {
    $q.notify({
      type: 'info',
      message: 'Open a channel to send a message'
    })
  }

  command.value = ''
  commandInput.value?.focus()
}

function runCommand(value) {
  const [name, ...args] = value.slice(1).split(/\s+/)
  const commandName = name.toLowerCase()

  if (commandName === 'help') {
    $q.notify({
      type: 'info',
      message: '/join, /invite, /revoke, /kick, /list, /cancel, /quit'
    })
    return
  }

  if (commandName === 'join' && args[0]) {
    const channelName = args[0].toLowerCase()
    const knownChannel = ['general', 'random'].includes(channelName)
    if (knownChannel) {
      router.push(`/chat/${channelName}`)
    }
    $q.notify({
      type: 'positive',
      message: `${knownChannel ? 'Joined' : 'Channel requested'} #${channelName}`
    })
    return
  }

  const supportedCommands = [
    'invite',
    'revoke',
    'kick',
    'list',
    'cancel',
    'quit'
  ]
  if (supportedCommands.includes(commandName)) {
    $q.notify({
      type: 'info',
      message: `Command /${commandName} is available in this prototype`
    })
    return
  }

  $q.notify({ type: 'warning', message: 'Unknown command. Try /help' })
}
</script>

<style scoped>
.command-bar {
  width: 100%;
}

.account-slot {
  width: 79px;
  flex: 0 0 79px;
}
</style>
