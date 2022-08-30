<template>
  <q-page padding>
    <h4>Accounts</h4>
    <ol>
      <li v-for="account in accounts" :key="account.id">
        {{ account.username }}
      </li>
    </ol>
    <span v-if="accounts.length === 0">No accounts found.</span>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const accounts = ref<{ id: number; username: string }[]>([]);

fetch('/api/accounts')
  .then((response) => response.json())
  .then((result) => (accounts.value = result))
  .catch((error) => console.error('Error getting accounts: %o', error));
</script>
