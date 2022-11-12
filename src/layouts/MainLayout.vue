<template>
  <q-layout view="hHh Lpr lff">
    <q-header>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Quasar App </q-toolbar-title>

        <div class="q-mr-sm text-white">{{ username }}</div>
        <q-btn icon="account_circle" round flat>
          <q-menu>
            <q-list>
              <q-item clickable v-close-popup @click="logout()">
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay
      :width="200"
      :breakpoint="500"
      show-if-above
      bordered
      class="bg-grey-3"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item clickable v-ripple @click="addBoard">
            <q-item-section avatar>
              <q-avatar color="positive" text-color="white" icon="add" />
            </q-item-section>

            <q-item-section>Create Board</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="viewBoards">
            <q-item-section avatar>
              <q-avatar color="accent" text-color="white" icon="table_view" />
            </q-item-section>

            <q-item-section>View Boards</q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-avatar color="info" text-color="white" icon="person_add" />
            </q-item-section>

            <q-item-section>Add User</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-black q-px-sm">
      <div class="text-caption">Created by Stephen Pinto</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCreateBoard, useLogout, useUsername } from 'src/queries';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();

const leftDrawerOpen = ref(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const miniState = ref(true); // used in template

const toggleLeftDrawer = () => (leftDrawerOpen.value = !leftDrawerOpen.value);

const { data: username } = useUsername();
const { mutate: logout } = useLogout();
const { mutate: createBoard } = useCreateBoard();

const addBoard = () => {
  $q.dialog({
    title: 'New Board Title (max 20 characters):',
    prompt: {
      model: '',
      type: 'text',
      isValid: (val) => val.length > 0 && val.length <= 20,
    },

    cancel: true,
    persistent: false,
  }).onOk((name: string) => {
    createBoard(name, {
      onError: (error) => {
        console.error('Error creating board: %o', error);
      },
    });
  });
};

const viewBoards = () => {
  router.push('/boards');
};
</script>
