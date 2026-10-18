<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar class="relative-position">
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          aria-label="Go back"
          @click="goBack"
        >
          <q-tooltip>Go back</q-tooltip>
        </q-btn>
        <q-space />

        <q-toolbar-title shrink class="text-weight-bold">Nexum</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      :model-value="workspaceRailVisible"
      @update:model-value="workspaceRailVisible = $event"
      show-if-above
      bordered
      :width="workspaceRailWidth"
      :breakpoint="0"
    >
      <div class="column full-height">
        <q-list>
          <q-item
            clickable
            v-ripple
            to="/chat/general"
            class="rounded-borders q-mb-xs flex flex-center q-px-none"
          >
            <q-avatar
              color="primary"
              text-color="white"
              square
              class="rounded-borders"
            >
              <q-icon name="chat" />
            </q-avatar>

            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 0]"
            >
              <div class="text-subtitle1 text-weight-bold">General</div>
              <div class="text-caption">General chat</div>
            </q-tooltip>
          </q-item>

          <q-item
            clickable
            v-ripple
            to="/chat/random"
            class="rounded-borders q-mb-xs flex flex-center q-px-none"
          >
            <q-avatar
              color="primary"
              text-color="white"
              square
              class="rounded-borders"
            >
              <q-icon name="shuffle" />
            </q-avatar>

            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 0]"
            >
              <div class="text-subtitle1 text-weight-bold">Random</div>
              <div class="text-caption">Random chat</div>
            </q-tooltip>
          </q-item>
        </q-list>

        <q-space />

      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered class="bg-white text-dark q-pa-none">
      <CommandBar />
    </q-footer>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import CommandBar from '@/components/CommandBar.vue'
import { chatStore } from '@/store/chatStore'

const router = useRouter()
const $q = useQuasar()
const route = useRoute()
const workspaceRailWidth = computed(() => ($q.screen.lt.md ? 56 : 80))
const workspaceRailVisible = computed({
  get() {
    if (!$q.screen.lt.md) return true
    if (route.path.startsWith('/account/edit')) return false
    return chatStore.workspaceRailVisible
  },
  set(value) {
    chatStore.workspaceRailVisible = value
  }
})

function goBack() {
  const previousRoute = window.history.state?.back

  if (previousRoute && !previousRoute.startsWith('/auth/')) {
    router.back()
    return
  }

  router.push('/chat/general')
}
</script>
