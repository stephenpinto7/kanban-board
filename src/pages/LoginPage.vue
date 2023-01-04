<template>
  <q-page padding class="row justify-center">
    <div class="column">
      <div class="row">
        <q-card square bordered class="q-pa-lg shadow-1">
          <q-form @submit="login">
            <q-card-section>
              <div class="text-h4">Login</div>
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
            </q-card-section>
            <q-card-actions class="q-px-md q-gutter-sm">
              <q-btn
                unelevated
                color="primary"
                size="lg"
                class="full-width"
                label="Login"
                type="submit"
                :loading="isLoading"
              />
              <q-btn
                flat
                to="/register"
                color="primary"
                size="md"
                class="full-width"
                label="Not a user? Register here."
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
import { useRouter } from 'vue-router';
import { useLogin } from 'src/queries';
import { type ValidationRule } from 'quasar';
import { HTTPError } from 'ky';

const router = useRouter();

const username = ref('');
const usernameRules: ValidationRule<string>[] = [
  (val) => val.length > 0 || 'username cannot be blank',
  (val) => val.length <= 20 || 'username must be 20 characters or less',
];

const password = ref('');
const passwordRules: ValidationRule<string>[] = [
  (val) => val.length > 0 || 'password cannot be blank',
  (val) => val.length <= 120 || 'password must be 120 characters or less',
];

const { mutate: postLogin, isLoading } = useLogin();
const error = ref('');

const login = () => {
  error.value = '';
  postLogin(
    { username: username.value, password: password.value },
    {
      onSuccess: () => {
        return router.push('/boards');
      },
      onError(loginError, variables, context) {
        if (loginError instanceof HTTPError) {
          loginError.response.json().then((response) => {
            if (
              response?.error === 'no account exists with the supplied username'
            ) {
              error.value = 'No account found with that username';
            } else if (response?.error === 'password was incorrect') {
              error.value = 'Password was incorrect.';
            } else {
              error.value = 'An unexpected error occured.';
            }
          });
        } else {
          error.value = 'An unexpected error occured.';
        }
      },
    }
  );
};
</script>
