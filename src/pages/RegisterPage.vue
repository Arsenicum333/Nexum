<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <q-card class="q-pa-md" style="width: 520px; max-width: 100%">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Nexum</div>
        <div class="text-subtitle2 text-grey-7">Create an account</div>
      </q-card-section>

      <q-form @submit="onSubmit">
        <q-card-section>
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

        <q-card-actions class="q-px-md q-pb-md column">
          <q-btn
            type="submit"
            color="primary"
            label="Sign up"
            no-caps
            class="full-width"
          />
          <q-btn
            flat
            no-caps
            color="primary"
            label="Already have an account? Sign in"
            to="/auth/login"
            class="q-mt-sm"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const nickName = ref('')
const email = ref('')
const password = ref('')
const passwordRepeat = ref('')

function onSubmit() {
  router.push('/chat/general')
}
</script>
