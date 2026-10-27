<template>
  <q-page class="flex flex-center bg-grey-2">
    <q-card class="auth-card q-pa-sm q-pa-md-md">
      <q-card-section class="q-pb-none">
        <div class="text-h5 text-weight-bold auth-title">Nexum</div>
        <div class="text-subtitle2 text-grey-7">Sign in</div>
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section class="q-gutter-sm q-gutter-md-md">
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

        <q-card-actions class="q-px-sm q-px-md-md q-pb-sm q-pb-md-md column">
          <q-btn
            type="submit"
            color="primary"
            label="Sign in"
            no-caps
            class="full-width"
            :loading="isSubmitting"
            :disable="isSubmitting"
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
import { useQuasar } from 'quasar'
import { userStore } from '@/store/userStore'
import { authApi } from '@/services/authApi'

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)

async function onSubmit() {
  isSubmitting.value = true
  try {
    userStore.update(
      await authApi.login({ email: email.value, password: password.value })
    )
    userStore.setAuthenticated(true)
    await router.push(routeTarget())
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  } finally {
    isSubmitting.value = false
  }
}

function routeTarget() {
  return router.currentRoute.value.query.redirect || '/chat/general'
}
</script>

<style scoped>
.auth-card {
  width: 25rem;
  max-width: 90vw;
}

@media (max-width: 599px) {
  .auth-card {
    width: calc(100vw - 1.5rem);
    max-width: calc(100vw - 1.5rem);
  }

  .auth-title {
    font-size: 1.25rem;
    line-height: 1.3;
  }
}
</style>
