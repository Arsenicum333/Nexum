<template>
  <q-btn
    flat
    round
    dense
    icon="notifications"
    color="grey-7"
    aria-label="Notifications"
  >
    <q-badge v-if="unreadCount" color="negative" floating rounded>
      {{ unreadCount }}
    </q-badge>

    <q-menu anchor="bottom right" self="top right" :offset="[0, 8]">
      <q-card flat style="width: 340px; max-width: 90vw">
        <q-card-section class="row items-center q-py-sm">
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
        </q-card-section>

        <q-separator />

        <q-list v-if="notifications.length">
          <q-item
            v-for="item in notifications"
            :key="item.id"
            clickable
            v-close-popup
            :to="item.to"
            :class="{ 'bg-orange-1': !item.read }"
            @click="item.read = true"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" size="40px">
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
                size="10px"
                color="primary"
                class="q-mt-xs"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="column items-center text-grey-6 q-pa-lg">
          <q-icon name="notifications_none" size="40px" />
          <div class="q-mt-sm">No notifications</div>
        </div>

        <template v-if="notifications.length">
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

const notifications = ref([
  {
    id: 1,
    icon: 'alternate_email',
    title: 'Mariya mentioned you',
    text: 'in #general: Hello everyone! How is the development going?',
    time: '12:32',
    read: false,
    to: '/chat/general'
  }
])

const unreadCount = computed(
  () => notifications.value.filter(item => !item.read).length
)

function markAllRead() {
  notifications.value.forEach(item => {
    item.read = true
  })
}
</script>
