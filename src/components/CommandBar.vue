<template>
  <div class="command-bar q-pr-md row items-center relative-position">
    <q-list class="account-slot">
      <UserMenu />
    </q-list>
    <q-separator vertical class="self-stretch" />
    <q-card
      v-if="mentionOptions.length"
      bordered
      class="mention-menu absolute"
    >
      <q-list dense padding>
        <div class="q-px-md q-pb-xs text-uppercase text-weight-bolder text-caption text-grey-7">
          Mention
        </div>
        <q-item
          v-for="member in mentionOptions"
          :key="member.id"
          clickable
          v-ripple
          class="rounded-borders q-mx-xs"
          @click="insertMention(member)"
        >
          <q-item-section avatar class="min-width-auto q-pr-sm">
            <q-avatar
              size="1.5rem"
              :color="member.status === 'online' ? 'positive' : 'grey-6'"
              text-color="white"
            >
              {{ member.name[0]?.toUpperCase() }}
            </q-avatar>
          </q-item-section>
          <q-item-section>{{ member.name }}</q-item-section>
          <q-item-section side>@{{ member.username }}</q-item-section>
        </q-item>
      </q-list>
    </q-card>
    <q-input
      ref="commandInput"
      v-model="command"
      dense
      outlined
      autofocus
      :placeholder="inputPlaceholder"
      class="command-input col q-ml-sm q-ml-md-md"
      @keyup.enter="onEnter"
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
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import UserMenu from '@/components/UserMenu.vue'
import { chatStore } from '@/store/chatStore'
import { userStore } from '@/store/userStore'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const command = ref('')
const commandInput = ref(null)

const currentChannelName = computed(() => {
  const channel = chatStore.textChannels.find(
    item => item.id === chatStore.activeChannel
  )
  return channel?.name || 'channel'
})

const inputPlaceholder = computed(() =>
  route.path.startsWith('/chat/')
    ? `Write in #${currentChannelName.value}... use @ to mention`
    : 'Write a message or type /help'
)

const members = computed(() => chatStore.getMembers(userStore))
const mentionQuery = computed(() => {
  const match = command.value.match(/(?:^|\s)@(\w*)$/)
  return match ? match[1].toLowerCase() : null
})
const mentionOptions = computed(() => {
  if (!route.path.startsWith('/chat/') || mentionQuery.value === null) return []
  return members.value.filter(
    member =>
      member.id !== 'me' &&
      member.username.toLowerCase().startsWith(mentionQuery.value)
  )
})

function insertMention(member) {
  command.value = command.value.replace(/@(\w*)$/, `@${member.username} `)
  commandInput.value?.focus()
}

function onEnter() {
  if (mentionOptions.value.length) {
    insertMention(mentionOptions.value[0])
    return
  }
  submitCommand()
}

function submitCommand() {
  const value = command.value.trim()
  if (!value) return

  if (value.startsWith('/')) {
    const commandHandled = runCommand(value)
    if (!commandHandled && route.path.startsWith('/chat/')) {
      chatStore.addMessage(value)
    }
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
    return true
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
    return true
  }

  if (commandName === 'list') {
    if (!route.path.startsWith('/chat/')) {
      $q.notify({ type: 'info', message: 'Open a channel to list its members' })
      return true
    }

    chatStore.openMembersDialog()
    return true
  }

  const supportedCommands = [
    'invite',
    'revoke',
    'kick',
    'cancel',
    'quit'
  ]
  if (supportedCommands.includes(commandName)) {
    $q.notify({
      type: 'info',
      message: `Command /${commandName} is available in this prototype`
    })
    return true
  }

  return false
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

.mention-menu {
  left: 6rem;
  right: 1rem;
  bottom: 100%;
  z-index: 10;
  margin-bottom: 0.25;
}

@media (max-width: 1024px) {
  .command-bar {
    padding-right: 0.5rem;
  }

  .account-slot {
    width: 55px;
    flex-basis: 55px;
  }

  .mention-menu {
    left: 4rem;
    right: 0.5rem;
  }
}
</style>
