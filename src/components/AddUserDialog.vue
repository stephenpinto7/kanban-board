<template>
  <q-dialog ref="dialogRef">
    <q-card class="q-pa-md" style="min-width: 50vw">
      <q-card-section>
        <div class="row justify-between q-gutter-sm">
          <q-input
            v-model="username"
            label="Username"
            outlined
            @update:model-value="validationStatus = 'unchecked'"
          />
          <q-btn
            :label="
              validationStatus === 'unchecked'
                ? 'Check User'
                : validationStatus === 'valid'
                ? 'User Found'
                : 'Unknown User'
            "
            :color="
              validationStatus === 'unchecked'
                ? 'info'
                : validationStatus === 'valid'
                ? 'positive'
                : 'negative'
            "
            :loading="checkingUser"
            @click="validateUser"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          label="Add"
          flat
          :disable="validationStatus !== 'valid'"
          @click="onDialogOK(userId?.toString())"
        />
        <q-btn color="negative" label="Cancel" @click="onDialogCancel" flat />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { ref } from 'vue';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const username = ref('');
const userId = ref<number | null>(null);
const validationStatus = ref<'valid' | 'invalid' | 'unchecked'>('unchecked');
const checkingUser = ref(false);

const validateUser = async () => {
  try {
    checkingUser.value = true;
    const foundUserResponse = await fetch('/api/users/' + username.value, {
      credentials: 'include',
    });

    if (!foundUserResponse.ok) {
      throw Error('Error response when finding user');
    }

    userId.value = await foundUserResponse.json();

    validationStatus.value = 'valid';
  } catch (error) {
    validationStatus.value = 'invalid';
    console.error('Error finding user: %o', error);
  } finally {
    checkingUser.value = false;
  }
};
</script>
