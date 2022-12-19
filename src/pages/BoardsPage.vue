<template>
  <q-page padding>
    <h1 class="text-h3 text-center">Available Boards</h1>
    <q-skeleton v-if="loading" type="rect" width="100%" height="25vh" />
    <div v-else-if="error">
      <q-banner rounded class="bg-red text-white">
        An unexpected error occured.
      </q-banner>
    </div>
    <div v-else class="row q-gutter-lg q-px-lg">
      <q-card
        v-for="board in boards"
        :key="board.id"
        @click="router.push(`/board/${board.id}`)"
      >
        <q-card-section>
          <div class="text-h6" style="min-width: 20ch">{{ board.title }}</div>
        </q-card-section>
        <q-card-section>
          <q-chip>
            <q-avatar icon="history" color="green" />
            {{ formatTimeAgo(board.last_updated) }}
          </q-chip>
        </q-card-section>
      </q-card>
      <div class="self-center">
        <q-btn icon="add" color="primary" round size="lg" @click="addBoard">
          <q-tooltip>Create New Board</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useBoards } from 'src/queries';
import { useTimeAgo } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { useCreateBoard } from 'src/queries';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const router = useRouter();

const { data: boards, isLoading: loading, isError: error } = useBoards();

const formatTimeAgo = (date: string) => {
  return useTimeAgo(Date.parse(date)).value;
};

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
        $q.notify({ type: 'negative', message: 'An unexpected error occured' });
      },
    });
  });
};
</script>
