<template>
  <q-chip icon="person" outline color="accent">
    {{ user ? user.username : blankText }}
    <q-tooltip>{{ tooltip }}</q-tooltip>
  </q-chip>
</template>

<script setup lang="ts">
import { useBoardUsers } from 'src/queries';
import { computed, toRef } from 'vue';

const props = defineProps<{
  boardId: number;
  userId: number | null;
  blankText: string;
  tooltip: string;
}>();

const { data: users } = useBoardUsers(toRef(props, 'boardId'));
const user = computed(() => users.value?.find((u) => u.id === props.userId));
</script>
