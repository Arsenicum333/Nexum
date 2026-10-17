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
            v-for="channel in textChannels"
            :key="channel.id"
            clickable
            v-ripple
            :active="activeChannel === channel.id"
            active-class="bg-grey-4 text-primary text-weight-bold"
            class="rounded-borders q-mx-xs q-mb-xs"
            @click="activeChannel = channel.id"
          >
            <q-item-section avatar class="min-width-auto q-pr-sm">
              <q-icon :name="channel.private ? 'lock' : 'tag'" size="xs" />
            </q-item-section>
            <q-item-section class="ellipsis">
              {{ channel.name }}
            </q-item-section>
            <q-item-section side v-if="channel.unread">
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

      <q-scroll-area class="col q-pa-md">
        <div v-for="msg in currentMessages" :key="msg.id" class="q-mb-md">
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
            {{ msg.text }}
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

      <div class="q-px-md q-pb-md">
        <q-input
          v-model="newMessage"
          dense
          outlined
          rounded
          :placeholder="`Write in #${currentChannelName}...`"
          @keyup.enter="sendMessage"
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
import { ref, computed } from 'vue'
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
  { id: 'random', name: 'random', private: false, unread: 0, owner: 'me' }
])

const channelMessages = ref({
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
  random: []
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

const currentMessages = computed(
  () => channelMessages.value[activeChannel.value] || []
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
  currentMessages.value.push({
    id: Date.now(),
    author: 'me',
    text: newMessage.value,
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  })
  newMessage.value = ''
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
