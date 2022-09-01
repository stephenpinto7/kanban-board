<template>
  <q-page padding>
    <q-form @submit.prevent="submit" class="q-mb-md">
      <h4>Login</h4>
      <div class="row q-gutter-sm">
        <q-input
          v-model="username"
          name="username"
          label="username"
          outlined
          :rules="[(val) => val?.length > 0 || 'username cannot be blank']"
        />
        <q-input
          v-model="password"
          name="password"
          type="password"
          label="password"
          outlined
          :rules="[(val) => val?.length > 0 || 'password cannot be blank']"
        />
      </div>
      <div class="row">
        <q-btn label="Register" color="primary" type="submit" />
      </div>
    </q-form>
    <h4>Accounts:</h4>
    <div class="row">
      <ul>
        <li v-for="account in accounts" :key="account.id">{{ account }}</li>
      </ul>
    </div>
    <div class="row">
      <q-btn label="Get Accounts" color="primary" @click="getAccounts" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const username = ref('');
const password = ref('');

const submit = async () => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      username: username.value,
      password: password.value,
    }),
  });

  console.log('Server response: %o', await response.json());
};

const accounts = ref<any[]>([]);

const getAccounts = async () => {
  const response = await fetch('/api/accounts', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.ok) {
    accounts.value = await response.json();
  } else {
    console.error('fetch failed: %o', await response.json());
  }
};
</script>
