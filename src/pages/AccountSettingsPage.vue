<template>
  <q-page class="flex fit" :class="isMobile ? 'column' : 'row'">
    <div
      v-if="!isMobile"
      class="settings-sidebar bg-grey-2 column"
    >
      <div class="q-pa-md text-weight-bold text-subtitle1 border-bottom">
        Settings
      </div>

      <q-list padding dense class="col">
        <q-item
          clickable
          v-ripple
          active
          active-class="bg-grey-4 text-primary text-weight-bold"
          class="rounded-borders q-mx-xs"
        >
          <q-item-section>My Account</q-item-section>
        </q-item>
      </q-list>
    </div>

    <div
      class="col scroll bg-white q-pa-md q-pa-lg-md"
      style="min-width: 0;"
    >
      <div class="settings-content">
        <div class="row items-center q-mb-md">
          <q-btn
            v-if="isMobile"
            flat
            round
            dense
            icon="arrow_back"
            aria-label="Back to settings"
            class="q-mr-sm"
            @click="$router.back()"
          />
          <div>
            <div class="text-h5 text-weight-bold">My Account</div>
            <div class="text-subtitle2 text-grey-7">Edit profile</div>
          </div>
        </div>

        <div class="row items-center q-mb-lg">
          <q-avatar
            size="4rem"
            color="primary"
            text-color="white"
            class="q-mr-md"
          >
            {{ userStore.shownName[0]?.toUpperCase() }}
          </q-avatar>
          <div class="ellipsis">
            <div class="text-h6 text-weight-bold ellipsis">
              {{ userStore.shownName }}
            </div>
            <div class="text-caption text-grey-7 ellipsis">
              @{{ userStore.username }}
            </div>
          </div>
        </div>

        <q-form @submit="onSubmit">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="firstName"
                outlined
                label="First name"
                :rules="[val => !!val?.trim() || 'Enter your first name']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="lastName"
                outlined
                label="Last name"
                :rules="[val => !!val?.trim() || 'Enter your last name']"
              />
            </div>

            <div class="col-12">
              <q-input v-model="displayName" outlined label="Display name" />
            </div>

            <div class="col-12">
              <q-input
                v-model="username"
                outlined
                label="Username"
                prefix="@"
                hint="Must be unique"
                :rules="[val => !!val?.trim() || 'Enter a username']"
              />
            </div>

            <div class="col-12">
              <q-input
                v-model="email"
                outlined
                type="email"
                label="Email"
                :rules="[
                  val => !!val || 'Enter your email',
                  val => /^\S+@\S+\.\S+$/.test(val) || 'Invalid email'
                ]"
              />
            </div>
          </div>

          <q-btn
            type="submit"
            color="primary"
            label="Save changes"
            no-caps
            class="q-mt-md full-width-xs"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { userStore } from '@/store/userStore'

const $q = useQuasar()
const isMobile = computed(() => $q.screen.lt.sm)

const firstName = ref(userStore.firstName)
const lastName = ref(userStore.lastName)
const displayName = ref(userStore.displayName)
const username = ref(userStore.username)
const email = ref(userStore.email)

function onSubmit() {
  userStore.update({
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    displayName: displayName.value.trim(),
    username: username.value.trim(),
    email: email.value.trim()
  })
  $q.notify({ type: 'positive', message: 'Changes saved' })
}
</script>

<style scoped>
.settings-sidebar {
  width: 15rem;
  min-width: 15rem;
  border-right: 1px solid #e0e0e0;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.settings-content {
  max-width: 37.5rem;
}

@media (max-width: 600px) {
  .full-width-xs {
    width: 100%;
  }

  .settings-content > .text-h5 {
    font-size: 1.5rem;
  }

  .settings-content .q-avatar {
    width: 3rem;
    height: 3rem;
    font-size: 1.25rem;
  }
}
</style>
