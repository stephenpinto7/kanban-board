<template>
  <q-page padding>
    <q-btn icon="arrow_back" flat label="Back to Boards" to="/boards" />
    <q-skeleton v-if="loading" type="rect" />
    <q-banner v-else-if="error" class="text-white bg-red">
      An unexpected error occured.
    </q-banner>
    <div v-else>
      <h1 class="text-h3 text-center">{{ board?.title }}</h1>
      <div class="row items-center q-gutter-sm q-mb-md">
        <template v-for="user in users" :key="user.id">
          <q-chip
            v-if="user.id === board?.owner_id"
            class="glossy"
            icon="person"
            color="yellow"
            :class="
              user.id === currentUser?.userId ? 'current-user-border' : ''
            "
          >
            {{ user.username }}
            <template v-if="user.id === currentUser?.userId">
              <q-tooltip>You are the owner of this board</q-tooltip>
              <q-badge floating color="green" rounded />
            </template>
            <template v-else>
              <q-tooltip>Board Owner</q-tooltip>
            </template>
          </q-chip>
          <q-chip
            v-else
            icon="person"
            :class="
              user.id === currentUser?.userId ? 'current-user-border' : ''
            "
          >
            {{ user.username }}
            <template v-if="user.id === currentUser?.userId">
              <q-tooltip> This is you </q-tooltip>
              <q-badge floating color="green" rounded />
            </template>
          </q-chip>
        </template>
        <div>
          <q-btn
            v-if="currentUser && board && currentUser.userId === board.owner_id"
            round
            color="primary"
            icon="add"
            size="sm"
            @click="addUserDialog"
          />
        </div>
      </div>
      <q-btn
        color="primary"
        label="New Task"
        class="q-mb-md"
        @click="addTaskDialog"
      />
      <div class="row items-stretch q-col-gutter-lg">
        <div class="col-12 col-sm-6 col-md-4">
          <task-column :tasks="todoTasks" title="To Do" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <task-column :tasks="wipTasks" title="Work In Progress" />
        </div>
        <div class="col-12 col-sm-6 col-md-4">
          <task-column :tasks="doneTasks" title="Done" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import {
  useBoard,
  useTasks,
  useAddBoardUser,
  useBoardUsers,
  useCreateTask,
  useUser,
} from 'src/queries';
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import TaskColumn from 'src/components/TaskColumn.vue';
import EditTaskDialog from 'src/components/EditTaskDialog.vue';

const props = defineProps<{ boardId: string }>();
const boardId = computed(() => Number.parseInt(props.boardId, 10));
const $q = useQuasar();

const { data: board, isLoading: loading, isError: error } = useBoard(boardId);
const { mutate: addUser } = useAddBoardUser();

const { data: tasks } = useTasks(boardId);
const { mutate: createTask } = useCreateTask();

const { data: users } = useBoardUsers(boardId);
const { data: currentUser } = useUser();

const addUserDialog = () => {
  $q.dialog({
    title: 'Add User to Board',
    prompt: {
      model: '',
      type: 'number',
    },
    cancel: true,
  }).onOk((userId: string) => {
    const userIdNumber = parseInt(userId, 10);
    if (users.value?.some((u) => u.id === userIdNumber)) {
      $q.notify({
        type: 'warning',
        message: 'That user is already a member of this board',
      });
      return;
    }
    addUser(
      { userId, boardId: props.boardId },
      {
        onError: () => {
          $q.dialog({
            title: 'Unable to find user',
            message: 'Please try again',
          });
        },
      }
    );
  });
};

const addTaskDialog = () => {
  $q.dialog({
    component: EditTaskDialog,
    componentProps: {
      title: '',
      description: '',
      state: 'TODO',
      assignee: null,
      board: props.boardId,
    },
  }).onOk((taskEdit) => {
    createTask(
      {
        board: boardId.value,
        title: taskEdit.title,
        description: taskEdit.description,
        state: taskEdit.state,
        user: taskEdit.user,
        assignee: taskEdit.assignee,
      },
      {
        onError: (error) => {
          console.error('Error creating task: %o', error);
          $q.notify({
            type: 'negative',
            message: 'Unable to create task',
          });
        },
      }
    );
  });
};

const todoTasks = computed(
  () => tasks.value?.filter((t) => t.state === 'TODO') ?? []
);
const wipTasks = computed(
  () => tasks.value?.filter((t) => t.state === 'WIP') ?? []
);
const doneTasks = computed(
  () => tasks.value?.filter((t) => t.state === 'DONE') ?? []
);
</script>
