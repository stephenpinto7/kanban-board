<template>
  <q-card>
    <q-card-section class="row items-start justify-between">
      <div class="text-h6">{{ task.title }}</div>
      <div>
        <q-btn icon="edit" flat round dense color="info" @click="editTask">
          <q-tooltip anchor="top middle" self="bottom middle" :delay="750">
            Edit Task
          </q-tooltip>
        </q-btn>
        <q-btn
          icon="close"
          flat
          round
          dense
          color="negative"
          @click="performDeleteTask"
        >
          <q-tooltip anchor="top middle" self="bottom middle" :delay="750">
            Delete Task
          </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
    <q-card-section>
      <q-input
        :model-value="task.description"
        label="Description"
        type="textarea"
        readonly
        outlined
        input-style="resize: none"
      />
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
        @click="revert"
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
        @click="progress"
      >
        <q-tooltip anchor="top middle" self="bottom middle">
          Move next
        </q-tooltip>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { Task, useDeleteTask, useUpdateTask } from 'src/queries';
import { useTimeAgo } from '@vueuse/core';
import { useQuasar } from 'quasar';
import EditTaskDialog from 'src/components/EditTaskDialog.vue';

const props = defineProps<{
  task: Task;
}>();

const $q = useQuasar();

const created = useTimeAgo(props.task.created_date);
const lastActivity = useTimeAgo(props.task.last_updated);

const { mutate: deleteTask } = useDeleteTask();
const { mutate: updateTask } = useUpdateTask();

const performDeleteTask = () => {
  $q.dialog({
    title: 'Confirm',
    message:
      'Are you sure you want to delete this task? This action is permanent.',
    persistent: true,
    cancel: true,
  }).onOk(() => {
    deleteTask(
      { board: props.task.board_id, task: props.task.id },
      {
        onError: (error) => {
          console.error('Unable to delete task: %o', error);
          $q.notify({
            type: 'negative',
            message: 'An enexpected error occured.',
          });
        },
      }
    );
  });
};

const editTask = () => {
  $q.dialog({
    component: EditTaskDialog,
    componentProps: {
      title: props.task.title,
      description: props.task.description,
      state: props.task.state,
    },
  }).onOk((taskEdit) => {
    updateTask(
      {
        board: props.task.board_id,
        task: props.task.id,
        title: taskEdit.title,
        description: taskEdit.description,
        state: taskEdit.state,
      },
      {
        onError(error, _variables, _context) {
          console.error('Error updating task: %o', error);
        },
      }
    );
  });
};

const progress = () => {
  updateTask(
    {
      board: props.task.board_id,
      task: props.task.id,
      title: props.task.title,
      description: props.task.description,
      state: props.task.state === 'TODO' ? 'WIP' : 'DONE',
    },
    {
      onError(error, _variables, _context) {
        console.error('Error updating task: %o', error);
      },
    }
  );
};

const revert = () => {
  updateTask(
    {
      board: props.task.board_id,
      task: props.task.id,
      title: props.task.title,
      description: props.task.description,
      state: props.task.state === 'DONE' ? 'WIP' : 'TODO',
    },
    {
      onError(error, _variables, _context) {
        console.error('Error updating task: %o', error);
      },
    }
  );
};
</script>
