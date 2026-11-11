<template>
  <q-page class="flex row no-wrap fit">
    <div
      class="channels-sidebar bg-grey-2 column"
      :class="{ 'mobile-pane-hidden': isMobile && !showChannels }"
    >
      <div
        class="q-pa-md text-weight-bold text-subtitle1 row items-center justify-between border-bottom"
      >
        <span class="ellipsis">Some Workspace</span>
        <div class="row items-center">
          <q-btn flat round dense icon="expand_more" size="sm" />
          <q-btn
            v-if="isMobile"
            flat
            round
            dense
            icon="chat"
            size="sm"
            aria-label="Open chat"
            @click="showChannels = false"
          />
        </div>
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
            :active="chatStore.activeChannel === channel.id"
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
            @click="openChannel(channel)"
          >
            <q-item-section avatar class="min-width-auto q-pr-sm">
              <q-icon :name="channel.private ? 'lock' : 'tag'" size="xs" />
            </q-item-section>
            <q-item-section class="ellipsis">{{ channel.name }}</q-item-section>
            <q-item-section side v-if="channel.invited">
              <div class="row items-center no-wrap">
                <q-badge
                  rounded
                  color="orange-10"
                  text-color="white"
                  label="!"
                  class="text-weight-bold q-mr-xs"
                  style="padding: 0.25rem 0.5rem"
                />
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="close"
                  aria-label="Decline invitation"
                  @click.stop="declineInvitation(channel)"
                />
              </div>
            </q-item-section>
            <q-item-section side v-else-if="channel.unread">
              <q-badge rounded color="primary" :label="channel.unread" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </div>

    <div
      class="chat-pane col column bg-white"
      :class="{ 'mobile-pane-hidden': isMobile && showChannels }"
    >
      <div
        class="q-px-md q-py-sm border-bottom row items-center justify-between"
      >
        <div class="row items-center">
          <q-btn
            v-if="isMobile"
            flat
            round
            dense
            icon="arrow_back"
            aria-label="Open channels"
            class="q-mr-sm"
            @click="showChannels = true"
          />
          <q-icon
            :name="currentChannel?.private ? 'lock' : 'tag'"
            size="sm"
            class="q-mr-xs text-grey-7"
          />
          <span class="text-weight-bold text-subtitle1">{{
            currentChannel ? currentChannelName : 'No channel selected'
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
            @click="chatStore.openMembersDialog()"
          >
            <q-tooltip>View members</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="more_vert" color="grey-7">
            <q-tooltip>Channel options</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
              <q-list dense style="min-width: 11.25rem">
                <q-item
                  clickable
                  v-close-popup
                  :disable="
                    !currentChannel ||
                    currentChannel.invited ||
                    currentChannel.owner === 'me'
                  "
                  @click="leaveChannel"
                >
                  <q-item-section avatar
                    ><q-icon name="logout"
                  /></q-item-section>
                  <q-item-section>{{
                    currentChannel?.owner === 'me'
                      ? 'Close channel with /quit'
                      : 'Leave channel'
                  }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  clickable
                  v-close-popup
                  :disable="!currentChannel || currentChannel.owner !== 'me'"
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
          v-if="!currentChannel"
          class="full-height flex flex-center column text-grey-7"
        >
          <div class="q-mb-md">You are not a member of any channels yet.</div>
          <q-btn
            color="primary"
            icon="add"
            label="Create a channel"
            @click="openCreateChannelDialog"
          />
        </div>
        <div
          v-else
          class="row justify-center items-center text-caption text-grey-6"
          style="min-height: 2rem"
        >
          <q-spinner-dots v-if="loadingMore" size="1.5rem" color="primary" />
          <span v-else-if="!hasMore"
            >Beginning of #{{ currentChannelName }}</span
          >
        </div>

        <div
          v-if="currentChannel"
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
              size="1.75rem"
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

      <div v-if="typingUser" class="q-px-md q-py-xs text-caption text-grey-7">
        <span class="row items-center no-wrap">
          <q-spinner-dots size="1.25rem" color="grey-7" class="q-mr-xs" />
          <b>{{ typingUser }}</b
          >&nbsp;is typing...
        </span>
      </div>
    </div>

    <q-dialog v-model="createChannelDialog">
      <q-card class="chat-dialog create-channel-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Create channel</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>
        <q-form class="q-gutter-md" @submit="createChannel">
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

    <q-dialog v-model="chatStore.membersDialogOpen">
      <q-card class="chat-dialog members-dialog">
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
          <q-item class="q-py-md">
            <q-item-section>
              <q-input
                v-model="inviteUsername"
                dense
                outlined
                label="Invite by username"
                @keyup.enter="inviteMember"
              />
            </q-item-section>
            <q-item-section side>
              <q-btn
                round
                flat
                dense
                icon="person_add"
                aria-label="Invite member"
                :loading="inviteSubmitting"
                :disable="!inviteUsername.trim() || !currentChannel"
                @click="inviteMember"
              />
            </q-item-section>
          </q-item>
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { userStore } from '@/store/userStore'
import { chatStore } from '@/store/chatStore'
import NotificationsMenu from '@/components/NotificationsMenu.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const createChannelDialog = ref(false)
const showChannels = ref(true)
const newChannelName = ref('')
const newChannelType = ref('public')
const inviteUsername = ref('')
const inviteSubmitting = ref(false)
const scrollArea = ref(null)
const loadingMore = ref(false)
const pageSize = 20
const startIndexes = ref({})
const CHANNEL_REFRESH_INTERVAL_MS = 15000
let channelRefreshTimer
let isRefreshingChannels = false

const channelTypeOptions = [
  { label: 'Public channel - anyone can join', value: 'public' },
  { label: 'Private channel - invitation only', value: 'private' }
]

const isMobile = computed(() => $q.screen.lt.sm)

const currentChannel = computed(() =>
  chatStore.textChannels.find(channel => channel.id === chatStore.activeChannel)
)
const currentChannelName = computed(() => currentChannel.value?.name || '')
const typingUser = computed(() =>
  chatStore.activeChannel === 'random' ? 'Alex' : ''
)
const members = computed(() => chatStore.getMembers(userStore))
const sortedChannels = computed(() => chatStore.sortedChannels)
const lastMessage = computed(() => {
  const messages = chatStore.channelMessages[chatStore.activeChannel] || []
  return messages[messages.length - 1]
})

function ensureStartIndex(channelId) {
  if (startIndexes.value[channelId] !== undefined) return
  const total = (chatStore.channelMessages[channelId] || []).length
  startIndexes.value[channelId] = Math.max(0, total - pageSize)
}

const currentMessages = computed(() => {
  const channelId = chatStore.activeChannel
  ensureStartIndex(channelId)
  const all = chatStore.channelMessages[channelId] || []
  return all.slice(startIndexes.value[channelId] || 0)
})

const hasMore = computed(
  () => (startIndexes.value[chatStore.activeChannel] || 0) > 0
)

function syncChannelFromRoute(channelName) {
  const channel = chatStore.textChannels.find(item => item.name === channelName)
  if (channel) chatStore.activeChannel = channel.id
}

function selectChannel(channel) {
  chatStore.activeChannel = channel.id
  router.push(`/chat/${channel.name}`)
  if (isMobile.value) showChannels.value = false
}

async function openChannel(channel) {
  if (channel.invited) {
    await acceptInvitation(channel)
    return
  }
  selectChannel(channel)
}

function getScrollElement() {
  return scrollArea.value?.getScrollTarget()
}

function scrollToBottom() {
  nextTick(() => {
    const element = getScrollElement()
    if (element) element.scrollTop = element.scrollHeight
  })
}

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  const channelId = chatStore.activeChannel
  loadingMore.value = true
  const element = getScrollElement()
  const heightBefore = element?.scrollHeight || 0
  const positionBefore = element?.scrollTop || 0

  setTimeout(() => {
    startIndexes.value[channelId] = Math.max(
      0,
      startIndexes.value[channelId] - pageSize
    )
    loadingMore.value = false
    nextTick(() => {
      if (element && channelId === chatStore.activeChannel) {
        element.scrollTop = positionBefore + element.scrollHeight - heightBefore
      }
    })
  }, 300)
}

function onScroll(info) {
  if (info.verticalPosition < 80) loadMore()
}

watch(
  () => route.params.channelName,
  channelName => syncChannelFromRoute(channelName),
  { immediate: true }
)
watch(
  () => chatStore.activeChannel,
  channelId => {
    ensureStartIndex(channelId)
    if (channelId) {
      chatStore
        .loadMessages(channelId)
        .then(() => {
          if (channelId !== chatStore.activeChannel) return
          startIndexes.value[channelId] = Math.max(
            0,
            (chatStore.channelMessages[channelId] || []).length - pageSize
          )
          scrollToBottom()
        })
        .catch(error => {
          $q.notify({ type: 'negative', message: error.message })
        })
    }
    scrollToBottom()
  },
  { immediate: true }
)
watch(
  () => lastMessage.value?.id,
  () => {
    if (lastMessage.value?.author === 'me') scrollToBottom()
  }
)
watch(
  isMobile,
  mobile => {
    if (!mobile) showChannels.value = true
  },
  { immediate: true }
)
watch(
  [isMobile, showChannels],
  ([mobile, channelsVisible]) => {
    chatStore.workspaceRailVisible = !mobile || channelsVisible
  },
  { immediate: true }
)

async function refreshChannels() {
  if (isRefreshingChannels || document.visibilityState === 'hidden') return
  isRefreshingChannels = true
  try {
    await chatStore.loadChannels()
    const activeChannel = chatStore.textChannels.find(
      channel => channel.id === chatStore.activeChannel
    )
    const channelName = activeChannel?.name || 'general'
    if (route.params.channelName !== channelName) {
      await router.replace(`/chat/${channelName}`)
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  } finally {
    isRefreshingChannels = false
  }
}

function refreshChannelsWhenVisible() {
  if (document.visibilityState === 'visible') void refreshChannels()
}

onMounted(async () => {
  channelRefreshTimer = window.setInterval(
    refreshChannelsWhenVisible,
    CHANNEL_REFRESH_INTERVAL_MS
  )
  window.addEventListener('focus', refreshChannelsWhenVisible)
  document.addEventListener('visibilitychange', refreshChannelsWhenVisible)

  isRefreshingChannels = true
  try {
    await chatStore.loadChannels()
    syncChannelFromRoute(route.params.channelName)
    const selectedChannel = chatStore.textChannels.find(
      channel => channel.id === chatStore.activeChannel
    )
    if (selectedChannel && route.params.channelName !== selectedChannel.name) {
      await router.replace(`/chat/${selectedChannel.name}`)
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  } finally {
    isRefreshingChannels = false
  }
  scrollToBottom()
})

onUnmounted(() => {
  window.clearInterval(channelRefreshTimer)
  window.removeEventListener('focus', refreshChannelsWhenVisible)
  document.removeEventListener('visibilitychange', refreshChannelsWhenVisible)
})

function authorName(msg) {
  return msg.author === 'me' ? userStore.shownName : msg.author
}

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

function channelNameRule(value) {
  const normalizedName = value.trim().toLowerCase()
  if (!normalizedName) return 'Enter a channel name'
  if (!/^[a-z0-9-]+$/.test(normalizedName))
    return 'Use lowercase letters, numbers or hyphens'
  if (chatStore.textChannels.some(channel => channel.name === normalizedName))
    return 'This channel already exists'
  return true
}

function openCreateChannelDialog() {
  newChannelName.value = ''
  newChannelType.value = 'public'
  createChannelDialog.value = true
}

async function createChannel() {
  const name = newChannelName.value.trim().toLowerCase()
  if (channelNameRule(name) !== true) return
  try {
    const channel = await chatStore.createChannel(
      name,
      newChannelType.value === 'private'
    )
    await router.push(`/chat/${channel.name}`)
    createChannelDialog.value = false
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  }
}

async function leaveChannel() {
  try {
    const channel = await chatStore.leaveActiveChannel()
    await router.push(channel ? `/chat/${channel.name}` : '/chat/general')
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  }
}

async function deleteChannel() {
  try {
    const channel = await chatStore.deleteActiveChannel()
    await router.push(channel ? `/chat/${channel.name}` : '/chat/general')
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  }
}

async function acceptInvitation(channel) {
  try {
    const accepted = await chatStore.acceptInvitation(channel)
    if (accepted) {
      await router.push(`/chat/${accepted.name}`)
      if (isMobile.value) showChannels.value = false
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  }
}

async function declineInvitation(channel) {
  try {
    await chatStore.declineInvitation(channel)
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  }
}

async function inviteMember() {
  const username = inviteUsername.value.trim()
  if (!username) return
  inviteSubmitting.value = true
  try {
    await chatStore.inviteMember(username)
    inviteUsername.value = ''
    $q.notify({ type: 'positive', message: `Invitation sent to @${username}` })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  } finally {
    inviteSubmitting.value = false
  }
}
</script>

<style scoped>
.channels-sidebar {
  width: 15rem;
  min-width: 15rem;
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

.chat-dialog {
  width: 26.25rem;
  max-width: calc(100vw - 1.5rem);
}

.members-dialog {
  width: 22.5rem;
}

@media (max-width: 600px) {
  .channels-sidebar {
    width: 100%;
    min-width: 0;
  }

  .mobile-pane-hidden {
    display: none !important;
  }

  .chat-pane :deep(.q-px-md) {
    padding-left: 0.625rem;
    padding-right: 0.625rem;
  }

  .chat-pane :deep(.q-pa-md) {
    padding: 0.625rem;
  }

  .chat-pane .text-subtitle1 {
    font-size: 0.95rem;
  }

  .channels-sidebar :deep(.q-pa-md) {
    padding: 0.625rem;
  }

  .channels-sidebar :deep(.q-list--padding) {
    padding: 0.5rem;
  }

  .chat-dialog :deep(.q-card__section),
  .chat-dialog :deep(.q-card__actions) {
    padding: 0.75rem;
  }
}
</style>
