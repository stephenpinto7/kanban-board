<template>
  <q-layout view="hhh lpr fff">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="view_kanban" size="2em" />
          Kanban Board
        </q-toolbar-title>
        <q-btn icon="question_mark" round flat dense to="/about">
          <q-tooltip anchor="bottom middle" self="top middle">
            Learn More
          </q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-black">
      <span class="text-caption"
        >Created by Stephen Pinto (
        <a href="mailto:spinto7@hotmail.com">spinto7@hotmail.com</a>). Source
        code available at
        <a target="blank" href="https://github.com/stephenpinto7/kanban-board">
          https://github.com/stephenpinto7/kanban-board
        </a></span
      >
    </q-footer>
  </q-layout>
</template>
