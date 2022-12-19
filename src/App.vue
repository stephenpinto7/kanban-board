<template>
  <router-view />
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();

fetch('/api/username', {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  credentials: 'include',
})
  .then((response) => {
    if (response.ok) {
      router.push('/boards');
    } else {
      router.push('/');
    }
  })
  .catch((error) => {
    console.error('Error: %o', error);
    $q.notify({
      type: 'negative',
      message: 'An unexpected error occured',
    });
  });
</script>
