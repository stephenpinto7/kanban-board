<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="q-pa-md" style="min-width: 50vw">
      <q-form @submit.stop.prevent="submit" @reset.stop.prevent="reset">
        <div class="row justify-between q-mb-lg">
          <q-input
            v-model="task.title"
            :rules="titleRules"
            label="Title"
            outlined
            style="min-width: 39ch"
          />
          <q-select
            v-model="task.state"
            :options="stateOptions"
            emit-value
            label="State"
            outlined
            style="min-width: 13ch"
          />
        </div>
        <q-input
          v-model="task.description"
          :rules="descriptionRules"
          label="Description"
          outlined
          type="textarea"
          class="q-mb-sm"
        />

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
import { reactive } from 'vue';

interface TaskEdit {
  title: string;
  description: string;
  state: TaskState;
}

const props = defineProps<TaskEdit>();

const task = reactive<TaskEdit>(Object.assign({}, props));

const titleRules: ValidationRule[] = [
  (val: string) => val.length > 0 || 'Title is required',
  (val: string) => val.length <= 30 || 'Max 30 characters',
];

const stateOptions: QSelectOption[] = [
  { label: 'To-Do', value: 'TODO' },
  { label: 'Work In Progress', value: 'WIP' },
  { label: 'Done', value: 'DONE' },
];

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
