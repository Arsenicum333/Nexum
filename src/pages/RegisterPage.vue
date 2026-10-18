<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-sm q-pa-md-md">
    <q-card class="auth-card q-pa-sm q-pa-md-md">
      <q-card-section class="q-pb-none">
        <div class="text-h5 text-weight-bold auth-title">Nexum</div>
        <div class="text-subtitle2 text-grey-7">Create an account</div>
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section>
          <div class="row q-col-gutter-sm q-col-gutter-md-md">
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
              <q-input
                v-model="nickName"
                outlined
                label="Nickname"
                prefix="@"
                hint="Must be unique"
                :rules="[val => !!val?.trim() || 'Enter a nickname']"
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

            <div class="col-12 col-sm-6">
              <q-input
                v-model="password"
                outlined
                type="password"
                label="Password"
                :rules="[
                  val => (val && val.length >= 6) || 'At least 6 characters'
                ]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="passwordRepeat"
                outlined
                type="password"
                label="Repeat password"
                :rules="[val => val === password || 'Passwords do not match']"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="q-px-sm q-px-md-md q-pb-sm q-pb-md-md column">
          <q-btn
            type="submit"
            color="primary"
            label="Sign up"
            no-caps
            class="full-width"
          />
          <div class="q-mt-sm row items-center justify-center q-gutter-xs">
            <span>Already have an account?</span>

            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Sign in"
              to="/auth/login"
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

const firstName = ref('')
const lastName = ref('')
const nickName = ref('')
const email = ref('')
const password = ref('')
const passwordRepeat = ref('')

function onSubmit() {
  userStore.setAuthenticated(true)
  router.push('/chat/general')
}
</script>

<style scoped>
.auth-card {
  width: 32.5rem;
  max-width: 100%;
}

@media (max-width: 599px) {
  .auth-card {
    width: 100%;
    max-width: 100%;
  }

  .auth-title {
    font-size: 1.25rem;
    line-height: 1.3;
  }
}
</style>
