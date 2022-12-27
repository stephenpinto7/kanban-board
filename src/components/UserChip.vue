<template>
  <q-chip icon="person" outline color="accent">
    {{ user ? user.username : blankText }}
    <q-tooltip>{{ tooltip }}</q-tooltip>
    <q-badge
      v-if="indicator && user?.id === currentUser?.userId"
      floating
      color="green"
      rounded
    />
  </q-chip>
</template>

<script setup lang="ts">
import { useBoardUsers, useUser } from 'src/queries';
import { computed, toRef } from 'vue';

const props = defineProps<{
  boardId: number;
  userId: number | null;
  blankText: string;
  tooltip: string;
  indicator?: boolean;
}>();

const { data: users } = useBoardUsers(toRef(props, 'boardId'));
const user = computed(() => users.value?.find((u) => u.id === props.userId));

const { data: currentUser } = useUser();
</script>
