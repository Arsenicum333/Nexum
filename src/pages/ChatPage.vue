<template>
  <q-page class="flex row no-wrap fit">
    <div class="channels-sidebar bg-grey-2 column">
      <div
        class="q-pa-md text-weight-bold text-subtitle1 row items-center justify-between border-bottom"
      >
        <span class="ellipsis">Some Workspace</span>
        <q-btn flat round dense icon="expand_more" size="sm" />
      </div>

      <q-scroll-area class="col">
        <q-list padding dense class="text-grey-8">
          <div class="row items-center justify-between q-px-sm q-pb-xs">
            <span
              class="text-uppercase text-weight-bolder text-caption text-grey-7"
            >
              Text Channels
            </span>
            <q-btn
              flat
              round
              dense
              icon="add"
              size="xs"
              color="grey-7"
              @click="openCreateChannelDialog"
            >
              <q-tooltip>Create Channel</q-tooltip>
            </q-btn>
          </div>

          <q-item
            v-for="channel in sortedChannels"
            :key="channel.id"
            clickable
            v-ripple
            :active="activeChannel === channel.id"
            :active-class="
              channel.invited
                ? 'bg-orange text-white text-weight-bold'
                : 'bg-grey-4 text-primary text-weight-bold'
            "
            class="rounded-borders q-mx-xs q-mb-xs"
            :class="{ 'bg-orange text-white': channel.invited }"
            :style="
              channel.invited
                ? 'box-shadow: 0 0 10px rgba(255, 152, 0, 0.6)'
                : ''
            "
            @click="activeChannel = channel.id"
          >
            <q-item-section avatar class="min-width-auto q-pr-sm">
              <q-icon :name="channel.private ? 'lock' : 'tag'" size="xs" />
            </q-item-section>
            <q-item-section class="ellipsis">
              {{ channel.name }}
            </q-item-section>
            <q-item-section side v-if="channel.invited">
              <q-badge
                rounded
                color="orange-10"
                text-color="white"
                label="!"
                class="text-weight-bold"
                style="padding: 3px 8px"
              />
            </q-item-section>
            <q-item-section side v-else-if="channel.unread">
              <q-badge rounded color="primary" :label="channel.unread" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </div>

    <div class="col column bg-white">
      <div
        class="q-px-md q-py-sm border-bottom row items-center justify-between"
      >
        <div class="row items-center">
          <q-icon
            :name="currentChannel?.private ? 'lock' : 'tag'"
            size="sm"
            class="q-mr-xs text-grey-7"
          />
          <span class="text-weight-bold text-subtitle1">{{
            currentChannelName
          }}</span>
        </div>
        <div>
          <NotificationsMenu />
          <q-btn
            flat
            round
            dense
            icon="people"
            color="grey-7"
            @click="membersDialog = true"
          >
            <q-tooltip>View members</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="more_vert" color="grey-7">
            <q-tooltip>Channel options</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
              <q-list dense style="min-width: 180px">
                <q-item clickable v-close-popup @click="leaveChannel">
                  <q-item-section avatar
                    ><q-icon name="logout"
                  /></q-item-section>
                  <q-item-section>Leave channel</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  v-close-popup
                  :disable="currentChannel?.owner !== 'me'"
                  @click="deleteChannel"
                >
                  <q-item-section avatar
                    ><q-icon name="delete" color="negative"
                  /></q-item-section>
                  <q-item-section class="text-negative"
                    >Delete channel</q-item-section
                  >
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <q-scroll-area ref="scrollArea" class="col q-pa-md" @scroll="onScroll">
        <div
          class="row justify-center items-center text-caption text-grey-6"
          style="min-height: 32px"
        >
          <q-spinner-dots v-if="loadingMore" size="24px" color="primary" />
          <span v-else-if="!hasMore"
            >Beginning of #{{ currentChannelName }}</span
          >
        </div>

        <div
          v-for="msg in currentMessages"
          :key="msg.id"
          class="q-mb-md q-pa-xs rounded-borders"
          :class="{ 'bg-orange-1': isMentioned(msg) }"
          :style="{
            borderLeft: isMentioned(msg)
              ? '3px solid #ff9800'
              : '3px solid transparent'
          }"
        >
          <div class="row items-center q-mb-xs">
            <q-avatar
              size="28px"
              color="amber-8"
              text-color="white"
              class="q-mr-sm"
            >
              {{ authorName(msg)[0] }}
            </q-avatar>
            <span class="text-weight-bold q-mr-sm">{{ authorName(msg) }}</span>
            <span class="text-caption text-grey-6">{{ msg.time }}</span>
          </div>
          <div class="q-pl-xl text-body2 text-grey-9">
            <template
              v-for="(part, index) in messageParts(msg.text)"
              :key="index"
            >
              <span
                v-if="part.mention"
                class="q-px-xs rounded-borders text-weight-bold"
                :class="
                  part.me
                    ? 'bg-orange-3 text-orange-10'
                    : 'bg-blue-1 text-primary'
                "
                >{{ part.text }}</span
              >
              <span v-else>{{ part.text }}</span>
            </template>
          </div>
        </div>
      </q-scroll-area>

      <div
        class="q-px-md q-py-xs text-caption text-grey-7 typing-line border-top"
      >
        <span v-if="typingUser" class="row items-center no-wrap">
          <q-spinner-dots size="20px" color="grey-7" class="q-mr-xs" />
          <b>{{ typingUser }}</b
          >&nbsp;is typing...
        </span>
      </div>

      <div class="q-px-md q-pb-md relative-position">
        <q-card
          v-if="mentionOptions.length"
          bordered
          class="absolute"
          style="
            left: 16px;
            right: 16px;
            bottom: 100%;
            margin-bottom: 4px;
            z-index: 10;
          "
        >
          <q-list dense padding>
            <div
              class="q-px-md q-pb-xs text-uppercase text-weight-bolder text-caption text-grey-7"
            >
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
                  size="24px"
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
          v-model="newMessage"
          dense
          outlined
          rounded
          :placeholder="`Write in #${currentChannelName}... use @ to mention`"
          @keyup.enter="onEnter"
        >
          <template v-slot:append>
            <q-btn
              round
              flat
              icon="send"
              color="primary"
              @click="sendMessage"
            />
          </template>
        </q-input>
      </div>
    </div>

    <q-dialog v-model="createChannelDialog">
      <q-card style="width: 420px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Create channel</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form @submit="createChannel" class="q-gutter-md">
          <q-card-section>
            <q-input
              v-model="newChannelName"
              outlined
              autofocus
              label="Channel name"
              hint="Use lowercase letters, numbers or hyphens"
              :rules="[channelNameRule]"
            />
            <q-option-group
              v-model="newChannelType"
              class="q-mt-md"
              type="radio"
              :options="channelTypeOptions"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat label="Cancel" />
            <q-btn color="primary" label="Create channel" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="membersDialog">
      <q-card style="width: 360px; max-width: 90vw">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">Channel members</div>
            <div class="text-caption text-grey-6"
              >{{ members.length }} members in #{{ currentChannelName }}</div
            >
          </div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>
        <q-list separator>
          <q-item v-for="member in members" :key="member.id">
            <q-item-section avatar>
              <q-avatar
                :color="member.status === 'online' ? 'positive' : 'grey-6'"
                text-color="white"
              >
                {{ member.name[0]?.toUpperCase() }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ member.name }}</q-item-label>
              <q-item-label caption>@{{ member.username }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                v-if="member.id === currentChannel?.owner"
                color="primary"
                label="owner"
              />
              <span v-else class="text-caption text-grey-6">{{
                member.status
              }}</span>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { userStore } from '@/store/userStore'
import NotificationsMenu from '@/pages/NotificationsMenu.vue'

const activeChannel = ref('gen')
const newMessage = ref('')
const createChannelDialog = ref(false)
const membersDialog = ref(false)
const newChannelName = ref('')
const newChannelType = ref('public')

const textChannels = ref([
  { id: 'gen', name: 'general', private: false, unread: 0, owner: 'me' },
  { id: 'ann', name: 'announcements', private: false, unread: 2, owner: 'me' },
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
])

const PAGE_SIZE = 20
const startIndexes = ref({})
const loadingMore = ref(false)
const scrollArea = ref(null)

function makeHistory(channel, count) {
  const authors = ['Alex', 'Mariya', 'me']
  return Array.from({ length: count }, (_, index) => {
    const minutes = 8 * 60 + index * 3
    const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mins = String(minutes % 60).padStart(2, '0')
    return {
      id: `${channel}-old-${index}`,
      author: authors[index % authors.length],
      text: `Message ${index + 1}`,
      time: `${hours}:${mins}`
    }
  })
}

const channelMessages = ref({
  gen: [
    ...makeHistory('gen', 62),
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
    },
    {
      id: 5,
      author: 'Alex',
      text: `Hey @${userStore.username}, can you check the new design before Friday?`,
      time: '12:35'
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
  random: makeHistory('random', 45),
  design: []
})

const channelTypeOptions = [
  { label: 'Public channel - anyone can join', value: 'public' },
  { label: 'Private channel - invitation only', value: 'private' }
]

const currentChannel = computed(() => {
  return textChannels.value.find(channel => channel.id === activeChannel.value)
})

const typingUser = computed(() =>
  activeChannel.value === 'random' ? 'Alex' : ''
)

const currentChannelName = computed(() => {
  return currentChannel.value?.name || 'general'
})

const currentMessages = computed(() => {
  const all = channelMessages.value[activeChannel.value] || []
  return all.slice(startIndexes.value[activeChannel.value] ?? 0)
})

const hasMore = computed(
  () => (startIndexes.value[activeChannel.value] ?? 0) > 0
)

function ensureStartIndex(channel) {
  if (startIndexes.value[channel] !== undefined) return
  const total = (channelMessages.value[channel] || []).length
  startIndexes.value[channel] = Math.max(0, total - PAGE_SIZE)
}

function getScrollElement() {
  return scrollArea.value?.getScrollTarget()
}

function scrollToBottom() {
  nextTick(() => {
    const el = getScrollElement()
    if (!el) return
    el.scrollTop = el.scrollHeight
    fillIfShort()
  })
}

function fillIfShort() {
  const el = getScrollElement()
  if (el && hasMore.value && el.scrollHeight <= el.clientHeight) loadMore()
}

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  const channel = activeChannel.value
  loadingMore.value = true

  setTimeout(() => {
    if (startIndexes.value[channel] === undefined) {
      loadingMore.value = false
      return
    }
    const el = getScrollElement()
    const heightBefore = el ? el.scrollHeight : 0
    const positionBefore = el ? el.scrollTop : 0

    startIndexes.value[channel] = Math.max(
      0,
      startIndexes.value[channel] - PAGE_SIZE
    )
    loadingMore.value = false

    nextTick(() => {
      if (el && channel === activeChannel.value) {
        el.scrollTop = positionBefore + (el.scrollHeight - heightBefore)
      }
      fillIfShort()
    })
  }, 600)
}

function onScroll(info) {
  if (info.verticalPosition < 80) loadMore()
}

watch(
  activeChannel,
  channel => {
    ensureStartIndex(channel)
    scrollToBottom()
  },
  { immediate: true }
)

onMounted(scrollToBottom)

const sortedChannels = computed(() =>
  [...textChannels.value].sort(
    (a, b) => Number(!!b.invited) - Number(!!a.invited)
  )
)

const members = computed(() => [
  {
    id: 'me',
    name: userStore.shownName,
    username: userStore.username,
    status: userStore.status
  },
  { id: 'alex', name: 'Alex', username: 'alex', status: 'online' },
  { id: 'mariya', name: 'Mariya', username: 'mariya', status: 'away' }
])

const mentionQuery = computed(() => {
  const match = newMessage.value.match(/(?:^|\s)@(\w*)$/)
  return match ? match[1].toLowerCase() : null
})

const mentionOptions = computed(() => {
  if (mentionQuery.value === null) return []
  return members.value.filter(
    member =>
      member.id !== 'me' &&
      member.username.toLowerCase().startsWith(mentionQuery.value)
  )
})

function messageParts(text) {
  return text
    .split(/(@\w+)/g)
    .filter(Boolean)
    .map(part => {
      const username = part.slice(1).toLowerCase()
      const isMention =
        part.startsWith('@') &&
        members.value.some(member => member.username.toLowerCase() === username)
      return {
        text: part,
        mention: isMention,
        me: isMention && username === userStore.username.toLowerCase()
      }
    })
}

function isMentioned(msg) {
  return msg.author !== 'me' && messageParts(msg.text).some(part => part.me)
}

function insertMention(member) {
  newMessage.value = newMessage.value.replace(/@(\w*)$/, `@${member.username} `)
}

function onEnter() {
  if (mentionOptions.value.length) {
    insertMention(mentionOptions.value[0])
    return
  }
  sendMessage()
}

function authorName(msg) {
  return msg.author === 'me' ? userStore.shownName : msg.author
}

function channelNameRule(value) {
  const normalizedName = value.trim().toLowerCase()
  if (!normalizedName) return 'Enter a channel name'
  if (!/^[a-z0-9-]+$/.test(normalizedName))
    return 'Use lowercase letters, numbers or hyphens'
  if (textChannels.value.some(channel => channel.name === normalizedName)) {
    return 'This channel already exists'
  }
  return true
}

function sendMessage() {
  if (!newMessage.value.trim()) return
  channelMessages.value[activeChannel.value].push({
    id: Date.now(),
    author: 'me',
    text: newMessage.value,
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  })
  newMessage.value = ''
  scrollToBottom()
}

function openCreateChannelDialog() {
  newChannelName.value = ''
  newChannelType.value = 'public'
  createChannelDialog.value = true
}

function createChannel() {
  const name = newChannelName.value.trim().toLowerCase()
  if (channelNameRule(name) !== true) return

  const id = `${name}-${Date.now()}`
  textChannels.value.push({
    id,
    name,
    private: newChannelType.value === 'private',
    unread: 0,
    owner: 'me'
  })
  channelMessages.value[id] = []
  activeChannel.value = id
  createChannelDialog.value = false
}

function leaveChannel() {
  removeCurrentChannel()
}

function deleteChannel() {
  removeCurrentChannel()
}

function removeCurrentChannel() {
  const currentIndex = textChannels.value.findIndex(
    channel => channel.id === activeChannel.value
  )
  if (currentIndex === -1 || textChannels.value.length === 1) return

  const nextChannel =
    textChannels.value[currentIndex === 0 ? 1 : currentIndex - 1]
  textChannels.value.splice(currentIndex, 1)
  delete channelMessages.value[activeChannel.value]
  delete startIndexes.value[activeChannel.value]
  activeChannel.value = nextChannel.id
}
</script>

<style scoped>
.channels-sidebar {
  width: 240px;
  min-width: 240px;
  border-right: 1px solid #e0e0e0;
}

.min-width-auto {
  min-width: auto;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.border-top {
  border-top: 1px solid #e0e0e0;
}

.typing-line {
  min-height: 28px;
}

.leading-tight {
  line-height: 1.2;
}
</style>
