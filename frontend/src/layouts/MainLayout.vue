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
        <q-list class="col scroll">
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

          <q-item
            v-for="workspace in workspaces"
            :key="workspace.id"
            clickable
            v-ripple
            class="rounded-borders q-mb-xs flex flex-center q-px-none"
          >
            <q-avatar
              color="primary"
              text-color="white"
              square
              class="rounded-borders text-weight-bold"
            >
              {{ workspace.name[0].toUpperCase() }}
            </q-avatar>

            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 0]"
            >
              <div class="text-subtitle1 text-weight-bold">{{
                workspace.name
              }}</div>
              <div class="text-caption">Workspace</div>
            </q-tooltip>
          </q-item>

          <q-item
            clickable
            v-ripple
            aria-label="Create workspace"
            class="rounded-borders q-mb-xs flex flex-center q-px-none"
            @click="openCreateWorkspaceDialog"
          >
            <q-avatar
              color="grey-3"
              text-color="primary"
              square
              class="rounded-borders"
            >
              <q-icon name="add" />
            </q-avatar>

            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 0]"
            >
              Create workspace
            </q-tooltip>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer bordered class="bg-white text-dark q-pa-none">
      <CommandBar />
    </q-footer>

    <q-dialog v-model="createWorkspaceDialog">
      <q-card class="workspace-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Create workspace</div>
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-form class="q-gutter-md" @submit="createWorkspace">
          <q-card-section>
            <q-input
              v-model="newWorkspaceName"
              outlined
              autofocus
              label="Workspace name"
              hint="Up to 24 characters"
              :rules="[workspaceNameRule]"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-px-md q-pb-md">
            <q-btn v-close-popup flat no-caps label="Cancel" />
            <q-btn
              color="primary"
              no-caps
              label="Create workspace"
              type="submit"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import CommandBar from '@/components/CommandBar.vue'
import { chatStore } from '@/store/chatStore'

const router = useRouter()
const $q = useQuasar()
const route = useRoute()
const createWorkspaceDialog = ref(false)
const newWorkspaceName = ref('')
const workspaces = computed(() => chatStore.workspaces)
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

function workspaceNameRule(value) {
  const name = (value || '').trim()
  if (!name) return 'Enter a workspace name'
  if (name.length > 24) return 'Use up to 24 characters'
  if (
    workspaces.value.some(
      item => item.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return 'This workspace already exists'
  }
  return true
}

function openCreateWorkspaceDialog() {
  newWorkspaceName.value = ''
  createWorkspaceDialog.value = true
}

function createWorkspace() {
  const name = newWorkspaceName.value.trim()
  if (workspaceNameRule(name) !== true) return
  chatStore.createWorkspace(name)
  createWorkspaceDialog.value = false
}

function goBack() {
  const previousRoute = window.history.state?.back

  if (previousRoute && !previousRoute.startsWith('/auth/')) {
    router.back()
    return
  }

  router.push('/chat/general')
}
</script>

<style scoped>
.workspace-dialog {
  width: 26.25rem;
  max-width: calc(100vw - 1.5rem);
}

@media (max-width: 600px) {
  .workspace-dialog :deep(.q-card__section),
  .workspace-dialog :deep(.q-card__actions) {
    padding: 0.75rem;
  }
}
</style>
