<template>
  <q-layout view="hHh Lpr lff">
    <q-header>
      <q-toolbar>
        <q-toolbar-title> Kanban Board</q-toolbar-title>

        <q-chip icon="person" outline color="white">
          {{ username }}
        </q-chip>
        <q-btn icon="logout" round flat @click="logout()">
          <q-tooltip> Log out </q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-black q-px-sm">
      <div class="text-caption">Created by Stephen Pinto</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useLogout, useUsername } from 'src/queries';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const { data: username } = useUsername();
const { mutate: logout } = useLogout();
</script>
