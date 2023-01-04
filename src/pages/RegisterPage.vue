<template>
  <q-page padding class="row justify-center">
    <div class="column">
      <div class="row">
        <q-card square bordered class="q-pa-lg shadow-1">
          <q-form @submit="registerUser">
            <q-card-section>
              <div class="text-h4">Register</div>
            </q-card-section>
            <q-card-section v-if="error">
              <q-banner class="bg-red text-white">
                {{ error }}
              </q-banner>
            </q-card-section>
            <q-card-section class="q-gutter-md" style="width: 25em">
              <q-input
                square
                filled
                v-model="username"
                label="username"
                :rules="usernameRules"
              />
              <q-input
                square
                filled
                v-model="password"
                type="password"
                label="password"
                :rules="passwordRules"
              />
              <q-input
                square
                filled
                v-model="passwordConfirm"
                type="password"
                label="confirm password"
                :rules="passwordConfirmRules"
              />
            </q-card-section>
            <q-card-actions class="q-px-md q-gutter-sm">
              <q-btn
                unelevated
                color="secondary"
                size="lg"
                class="full-width"
                label="Register"
                :loading="isLoading"
                type="submit"
              />
            </q-card-actions>
          </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useRegister } from 'src/queries';
import { type ValidationRule } from 'quasar';
import { HTTPError } from 'ky';

const $q = useQuasar();
const router = useRouter();

const username = ref('');
const usernameRules: ValidationRule<string>[] = [
  (val) => val.length > 0 || 'username cannot be blank',
  (val) => val.length <= 30 || 'username must be 30 characters or less',
];

const password = ref('');
const passwordRules: ValidationRule<string>[] = [
  (val) => val.length > 0 || 'password cannot be blank',
  (val) => val.length <= 120 || 'password must be 120 characters or less',
];

const passwordConfirm = ref('');
const passwordConfirmRules: ValidationRule<string>[] = [
  (val) => val.length > 0 || 'password cannot be blank',
  (val) => val.length <= 120 || 'password must be 120 characters or less',
  (val) => val === password.value || 'passwords do not match',
];

const { mutate: register, isLoading } = useRegister();
const error = ref('');

const registerUser = () => {
  error.value = '';
  register(
    { username: username.value, password: password.value },
    {
      onError(registerError, variables, context) {
        if (registerError instanceof HTTPError) {
          registerError.response.json().then((response) => {
            if (response?.error === 'Username already exists') {
              error.value = 'Username already taken, please try another.';
            } else {
              error.value = 'An unexpected error occured.';
            }
          });
        } else {
          error.value = 'An unexpected error occured.';
        }
      },
      onSuccess: () => {
        return router.push('/boards');
      },
    }
  );
};
</script>
