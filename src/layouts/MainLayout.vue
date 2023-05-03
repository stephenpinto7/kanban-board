<template>
  <q-layout view="hHh Lpr lff">
    <q-header>
      <q-toolbar>
        <q-toolbar-title> Kanban Board</q-toolbar-title>

        <q-chip icon="person" outline color="white">
          {{ username }}
        </q-chip>
        <q-btn icon="logout" round flat dense @click="logoutUser">
          <q-tooltip> Log out </q-tooltip>
        </q-btn>
        <q-btn icon="question_mark" round flat dense to="/about">
          <q-tooltip anchor="bottom middle" self="top middle">
            Learn More
          </q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-black">
      <span class="text-caption"
        >Created by Stephen Pinto (
        <a href="mailto:spinto7@hotmail.com">spinto7@hotmail.com</a>). Source
        code available at
        <a target="blank" href="https://github.com/stephenpinto7/kanban-board">
          https://github.com/stephenpinto7/kanban-board
        </a></span
      >
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useLogout, useUser } from 'src/queries';
import { useRouter } from 'vue-router';

const router = useRouter();

const { data: username } = useUser((user) => user.username);
const { mutate: logout } = useLogout();
const logoutUser = () => {
  logout(undefined, {
    onSuccess: () => router.push('/'),
  });
};
</script>
