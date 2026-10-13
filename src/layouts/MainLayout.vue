<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar class="relative-position">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <div class="absolute-center search-container">
          <q-input
            v-model="search"
            dense
            standout
            dark
            rounded
            placeholder="Search..."
            class="search-input"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <q-space />

        <q-toolbar-title shrink class="text-weight-bold">Nexum</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="80">
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

        <q-separator />
        <q-separator />
        <q-list>
          <UserMenu />
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import UserMenu from '@/pages/UserMenu.vue'
const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style scoped>
.search-container {
  width: 100%;
  max-width: 600px;
  padding: 0 16px;
}

@media (max-width: 600px) {
  .search-container {
    max-width: 200px;
  }
}
</style>
