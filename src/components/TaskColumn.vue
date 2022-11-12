<template>
  <div class="bg-grey-4 q-pa-md" style="min-height: 100%">
    <div class="column q-gutter-md">
      <div class="text-h5">{{ title }}</div>
      <template v-for="task in tasks" :key="task.id">
        <task-card :task="task" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Task } from 'src/queries';
import TaskCard from './TaskCard.vue';

const props = defineProps<{
  title: string;
  tasks: Task[];
}>();
</script>
