<template>
  <q-page class="flex row no-wrap fit">
    <div class="settings-sidebar bg-grey-2 column">
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

    <div class="col scroll bg-white q-pa-lg">
      <div class="settings-content">
        <div class="text-h5 text-weight-bold">My Account</div>
        <div class="text-subtitle2 text-grey-7 q-mb-md">Edit profile</div>

        <div class="row items-center q-mb-lg">
          <q-avatar
            size="64px"
            color="primary"
            text-color="white"
            class="q-mr-md"
          >
            {{ userStore.shownName[0]?.toUpperCase() }}
          </q-avatar>
          <div>
            <div class="text-h6 text-weight-bold">
              {{ userStore.shownName }}
            </div>
            <div class="text-caption text-grey-7"
              >@{{ userStore.username }}</div
            >
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
            class="q-mt-md"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { userStore } from '@/store/userStore'

const $q = useQuasar()

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
  width: 240px;
  min-width: 240px;
  border-right: 1px solid #e0e0e0;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

.settings-content {
  max-width: 600px;
}
</style>
