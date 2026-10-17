<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="q-pa-md" style="width: 400px; max-width: 90vw">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Nexum</div>
        <div class="text-subtitle2 text-grey-7">Sign in</div>
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="email"
            outlined
            type="email"
            label="Email"
            :rules="[val => !!val || 'Enter your email']"
          />

          <q-input
            v-model="password"
            outlined
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            :rules="[val => !!val || 'Enter your password']"
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-md column">
          <q-btn
            type="submit"
            color="primary"
            label="Sign in"
            no-caps
            class="full-width"
          />
          <div class="q-mt-sm row items-center justify-center q-gutter-xs">
            <span>Don't have an account?</span>

            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Sign up"
              to="/auth/register"
            />
          </div>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userStore } from '@/store/userStore'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

function onSubmit() {
  userStore.setAuthenticated(true)
  router.push(routeTarget())
}

function routeTarget() {
  return router.currentRoute.value.query.redirect || '/chat/general'
}
</script>
