<template>
  <q-card>
    <q-card-section class="row items-start justify-between">
      <div class="text-h6">{{ task.title }}</div>
      <q-btn icon="close" flat round dense color="negative">
        <q-tooltip anchor="top middle" self="bottom middle" :delay="750">
          Delete Task
        </q-tooltip>
      </q-btn>
    </q-card-section>
    <q-card-section>
      {{ task.description.substring(0, 50) }}...
    </q-card-section>
    <q-card-section>
      <div>Created: {{ created }}</div>
      <div>Last Activity: {{ lastActivity }}</div>
    </q-card-section>
    <q-card-actions align="between">
      <q-btn
        square
        color="primary"
        size="sm"
        icon="navigate_before"
        :disable="task.state === 'TODO'"
      >
        <q-tooltip anchor="top middle" self="bottom middle">
          Move back
        </q-tooltip>
      </q-btn>
      <q-btn
        square
        color="primary"
        size="sm"
        icon="navigate_next"
        :disable="task.state === 'DONE'"
      >
        <q-tooltip anchor="top middle" self="bottom middle">
          Move next
        </q-tooltip>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { Task } from 'src/queries';
import { useTimeAgo } from '@vueuse/core';

const props = defineProps<{
  task: Task;
}>();

const created = useTimeAgo(props.task.created_date);
const lastActivity = useTimeAgo(props.task.last_updated);
</script>
