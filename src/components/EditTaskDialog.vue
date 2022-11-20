<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="q-pa-md" style="min-width: 50vw">
      <q-form @submit="submit" @reset="reset">
        <q-card-section class="column q-gutter-md">
          <div class="row justify-between">
            <q-input
              v-model="task.title"
              :rules="titleRules"
              label="Title"
              outlined
              class="col-12 col-sm-5"
            />
            <q-select
              v-model="task.state"
              :options="stateOptions"
              emit-value
              map-options
              label="State"
              outlined
              class="col-12 col-sm-6 col-md-5"
            />
          </div>
          <div class="row">
            <q-select
              v-model="task.assignee"
              :options="assigneeOptions"
              :loading="usersLoading"
              emit-value
              map-options
              label="Assignee"
              outlined
              class="col-12 col-md-8"
            />
          </div>
          <div class="row">
            <q-input
              v-model="task.description"
              :rules="descriptionRules"
              counter
              :maxlength="500"
              label="Description"
              outlined
              type="textarea"
              class="col-12"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn color="primary" label="OK" type="submit" flat />
          <q-btn color="secondary" label="Reset" type="reset" flat />
          <q-btn color="negative" label="Cancel" @click="onDialogCancel" flat />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  useDialogPluginComponent,
  QSelectOption,
  ValidationRule,
} from 'quasar';
import { TaskState } from 'src/queries';
import { reactive, ref, toRef } from 'vue';
import { useBoardUsers } from 'src/queries';

interface TaskEdit {
  title: string;
  description: string;
  state: TaskState;
  assignee: number | null;
  board: number;
}

const props = defineProps<TaskEdit>();

const task = reactive<TaskEdit>(Object.assign({}, props));

const titleRules: ValidationRule[] = [
  (val: string) => val.length > 0 || 'Title is required',
  (val: string) => val.length <= 20 || 'Max 20 characters',
];

const stateOptions: QSelectOption[] = [
  { label: 'To Do', value: 'TODO' },
  { label: 'Work In Progress', value: 'WIP' },
  { label: 'Done', value: 'DONE' },
];

const { data: assigneeOptions, isLoading: usersLoading } = useBoardUsers(
  toRef(props, 'board'),
  (users): QSelectOption<number>[] =>
    users.map((u) => ({ label: u.username, value: u.id }))
);

const descriptionRules: ValidationRule[] = [
  (val: string) => val.length <= 500 || 'Max 500 characters',
];

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<TaskEdit>();

const submit = () => {
  onDialogOK(task);
};

const reset = () => {
  Object.assign(task, props);
};
</script>
