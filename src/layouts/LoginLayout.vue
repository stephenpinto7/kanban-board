<template>
  <q-layout view="hhh lpr fff">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="view_kanban" size="2em" />
          Kanban Board
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-black">
      <div class="text-caption">Created by Stephen Pinto</div>
    </q-footer>
  </q-layout>
</template>
