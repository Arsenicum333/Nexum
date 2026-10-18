<template>
  <q-btn
    flat
    round
    dense
    :icon="isOff ? 'notifications_off' : 'notifications'"
    color="grey-7"
    aria-label="Notifications"
  >

    <q-tooltip>Notifications</q-tooltip>

    <q-badge v-if="unreadCount" color="negative" floating rounded>
      {{ unreadCount }}
    </q-badge>

    <q-menu
      :anchor="isMobile ? 'bottom middle' : 'bottom right'"
      :self="isMobile ? 'top middle' : 'top right'"
      :offset="[0, 8]"
      content-class="notifications-menu"
    >
      <q-card flat class="notifications-card">
        <q-card-section class="row items-center no-wrap q-py-sm">
          <div class="text-subtitle1 text-weight-bold">Notifications</div>
          <q-space />
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            color="primary"
            label="Mark all as read"
            :disabled="!unreadCount"
            @click="markAllRead"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="settings"
            color="grey-7"
            class="q-ml-xs"
          >
            <q-tooltip>Notification settings</q-tooltip>

            <q-menu
              :anchor="isMobile ? 'bottom middle' : 'bottom right'"
              :self="isMobile ? 'top middle' : 'top right'"
              :offset="[0, 4]"
              content-class="notification-settings-menu"
            >
              <q-list dense padding>
                <div
                  class="q-px-md q-pb-xs text-uppercase text-weight-bolder text-caption text-grey-7"
                >
                  Notify me about
                </div>

                <q-item
                  v-for="mode in modes"
                  :key="mode.value"
                  clickable
                  v-close-popup
                  class="rounded-borders q-mx-xs"
                  :active="userStore.notificationMode === mode.value"
                  active-class="bg-grey-3 text-weight-bold"
                  @click="userStore.notificationMode = mode.value"
                >
                  <q-item-section avatar class="min-width-auto q-pr-sm">
                    <q-icon :name="mode.icon" size="xs" />
                  </q-item-section>
                  <q-item-section>{{ mode.label }}</q-item-section>
                  <q-item-section
                    side
                    v-if="userStore.notificationMode === mode.value"
                  >
                    <q-icon name="check" size="xs" color="primary" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-card-section>

        <q-separator />

        <q-list v-if="visibleNotifications.length">
          <q-item
            v-for="item in visibleNotifications"
            :key="item.id"
            clickable
            v-close-popup
            :to="item.to"
            :class="{ 'bg-orange-1': !item.read }"
            @click="item.read = true"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" size="2.5rem">
                <q-icon :name="item.icon" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ item.title }}
              </q-item-label>
              <q-item-label caption lines="2">{{ item.text }}</q-item-label>
            </q-item-section>

            <q-item-section side top>
              <q-item-label caption>{{ item.time }}</q-item-label>
              <q-icon
                v-if="!item.read"
                name="circle"
                size="0.625rem"
                color="primary"
                class="q-mt-xs"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="column items-center text-grey-6 q-pa-lg">
          <q-icon
            :name="isOff ? 'notifications_off' : 'notifications_none'"
            size="2.5rem"
          />
          <div class="q-mt-sm">
            {{ isOff ? 'Notifications are off' : 'No notifications' }}
          </div>
        </div>

        <template v-if="visibleNotifications.length">
          <q-separator />
          <div class="row justify-center q-pa-xs">
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              color="grey-7"
              label="Clear all"
              @click="notifications = []"
            />
          </div>
        </template>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { userStore } from '@/store/userStore'

const $q = useQuasar()
const isMobile = computed(() => $q.screen.lt.md)

const modes = [
  { value: 'all', label: 'All notifications', icon: 'notifications' },
  { value: 'mentions', label: 'Only mentions', icon: 'alternate_email' },
  { value: 'off', label: 'Turn off', icon: 'notifications_off' }
]

const notifications = ref([
  {
    id: 1,
    type: 'mention',
    icon: 'alternate_email',
    title: 'Mariya mentioned you',
    text: 'in #general: Hello everyone! How is the development going?',
    time: '12:32',
    read: false,
    to: '/chat/general'
  },
  {
    id: 2,
    type: 'message',
    icon: 'chat',
    title: 'New message in #announcements',
    text: 'The first prototype review is on Friday.',
    time: '09:15',
    read: false,
    to: '/chat/general'
  }
])

const isOff = computed(() => userStore.notificationMode === 'off')

const visibleNotifications = computed(() => {
  if (isOff.value) return []
  if (userStore.notificationMode === 'mentions') {
    return notifications.value.filter(item => item.type === 'mention')
  }
  return notifications.value
})

const unreadCount = computed(
  () => visibleNotifications.value.filter(item => !item.read).length
)

function markAllRead() {
  visibleNotifications.value.forEach(item => {
    item.read = true
  })
}
</script>

<style scoped>
.notifications-card {
  width: 21.25rem;
  max-width: calc(100vw - 1.5rem);
}

@media (max-width: 600px) {
  .notifications-card :deep(.q-card__section) {
    padding: 0.625rem;
  }

  .notifications-card :deep(.q-btn) {
    font-size: 0.75rem;
  }
}

:global(.notification-settings-menu) {
  max-width: calc(100vw - 1.5rem);
}

:global(.notification-settings-menu .q-list) {
  min-width: min(13.75rem, calc(100vw - 1.5rem));
}
</style>
