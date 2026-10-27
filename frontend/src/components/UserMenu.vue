<template>
  <q-item
    clickable
    v-ripple
    class="rounded-borders q-mb-xs flex flex-center q-px-none"
  >
    <div class="avatar-wrapper">
      <q-avatar
        color="primary"
        text-color="white"
        square
        class="rounded-borders"
      >
        <q-icon name="person" />
      </q-avatar>
      <span class="status-dot" :class="`bg-${currentStatus.color}`" />
    </div>
    <q-tooltip>Account</q-tooltip>

    <q-menu anchor="bottom right" self="bottom left" :offset="[10, 0]">
      <q-card flat class="account-menu-card">
        <q-card-section class="row items-center no-wrap">
          <div class="avatar-wrapper q-mr-md">
            <q-avatar color="primary" text-color="white" size="3rem">
              {{ userStore.shownName[0]?.toUpperCase() }}
            </q-avatar>
            <span class="status-dot" :class="`bg-${currentStatus.color}`" />
          </div>

          <div class="ellipsis">
            <div class="text-subtitle1 text-weight-bold ellipsis">
              {{ userStore.shownName }}
            </div>
            <div class="text-caption text-grey-7 ellipsis">
              @{{ userStore.username }}
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-list dense padding>
          <div
            class="q-px-md q-pb-xs text-uppercase text-weight-bolder text-caption text-grey-7"
          >
            Status
          </div>

          <q-item
            v-for="status in statuses"
            :key="status.value"
            clickable
            v-close-popup
            class="rounded-borders q-mx-xs"
            :active="currentStatus.value === status.value"
            active-class="bg-grey-3 text-weight-bold"
            @click="userStore.status = status.value"
          >
            <q-item-section avatar class="min-width-auto q-pr-sm">
              <q-icon name="circle" size="xs" :color="status.color" />
            </q-item-section>
            <q-item-section>{{ status.label }}</q-item-section>
            <q-item-section side v-if="currentStatus.value === status.value">
              <q-icon name="check" size="xs" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <q-list dense padding>
          <q-item
            clickable
            v-close-popup
            to="/account/edit"
            class="rounded-borders q-mx-xs"
          >
            <q-item-section avatar class="min-width-auto q-pr-sm">
              <q-icon name="settings" size="xs" />
            </q-item-section>
            <q-item-section>Settings</q-item-section>
          </q-item>

          <q-item
            clickable
            v-close-popup
            class="rounded-borders q-mx-xs text-negative"
            @click="logout"
          >
            <q-item-section avatar class="min-width-auto q-pr-sm">
              <q-icon name="logout" size="xs" color="negative" />
            </q-item-section>
            <q-item-section>Log out</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-menu>
  </q-item>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { userStore } from '@/store/userStore'
import { authApi } from '@/services/authApi'

const router = useRouter()

const statuses = [
  { value: 'online', label: 'Online', color: 'positive' },
  { value: 'offline', label: 'Offline', color: 'grey-6' },
  { value: 'dnd', label: 'Do not disturb', color: 'negative' }
]

const currentStatus = computed(() =>
  statuses.find(status => status.value === userStore.status)
)

async function logout() {
  await authApi.logout()
  userStore.clear()
  router.push('/auth/login')
}
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  display: inline-flex;
}

.status-dot {
  position: absolute;
  right: -0.25rem;
  bottom: -0.25rem;
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  border: 2px solid #fff;
}

.min-width-auto {
  min-width: auto;
}

.account-menu-card {
  width: 16rem;
}

@media (max-width: 1024px) {
  .account-menu-card {
    width: min(16rem, calc(100vw - 5rem));
  }
}
</style>
