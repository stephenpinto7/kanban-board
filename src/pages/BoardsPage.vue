<template>
  <q-page padding>
    <h1 class="text-h3 text-center">Available Boards</h1>
    <span v-if="loading || error || boards?.length === 0">{{
      loading || error || 'no boards'
    }}</span>
    <div v-else class="row q-gutter-lg">
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useBoards } from 'src/queries';
import { useTimeAgo } from '@vueuse/core';
import { useRouter } from 'vue-router';

const router = useRouter();

const { data: boards, isLoading: loading, isError: error } = useBoards();

const formatTimeAgo = (date: string) => {
  return useTimeAgo(Date.parse(date)).value;
};
</script>
