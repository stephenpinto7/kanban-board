<template>
  <q-page padding>
    <q-btn icon="arrow_back" flat label="Back to Home" to="/boards" />
    <h2 class="text-center">What is Kanban?</h2>
    <p>
      <a href="https://www.atlassian.com/agile/kanban" target="_blank">
        Kanban
      </a>
      is an
      <a href="https://www.atlassian.com/agile" target="_blank">Agile</a> work
      methodology, often contrasted against
      <a href="https://www.atlassian.com/agile/scrum" target="_blank">Scrum</a>.
      In Kanban, a small team breaks work into small tasks, and assign them to
      individuals. Tasks are tracked as they flow through a series of states.
      The classic states are <em>TODO</em>, <em>Work In Progress</em>, and
      <em>Done</em>. This is often tracked with a Kanban Board, with columns
      denoting the various states and tasks moving between them as progress is
      made. This demo site implements the basic functionality for a Kanban
      workflow.
    </p>
    <div class="row justify-around q-gutter-lg">
      <div style="width: 30em">
        <q-toolbar class="bg-primary text-white shadow-2">
          <q-toolbar-title>Site Features</q-toolbar-title>
        </q-toolbar>
        <q-list bordered separator>
          <q-item><q-item-section>Create/Delete boards</q-item-section></q-item>
          <q-item>
            <q-item-section> Add/remove users to/from boards </q-item-section>
          </q-item>
          <q-item><q-item-section>Create/Delete tasks</q-item-section></q-item>
          <q-item>
            <q-item-section>Assign users to tasks</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              Move tasks between the TODO, WIP, and Done states
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div style="width: 30em">
        <q-toolbar class="bg-primary text-white shadow-2">
          <q-toolbar-title>Tech Stack</q-toolbar-title>
        </q-toolbar>
        <q-list bordered separator>
          <q-item>
            <q-item-section>
              <span>
                Front end:
                <a href="https://quasar.dev/" target="_blank"
                  >Quasar Framework</a
                >
                (based on
                <a href="https://vuejs.org/" target="_blank">Vue.js v3</a>)
              </span>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <span>
                Back end: custom built with
                <a href="https://expressjs.com/" target="_blank">
                  Express JS
                </a>
              </span>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <span>
                Database:
                <a href="https://www.postgresql.org/" target="_blank">
                  PostgreSQL
                </a>
              </span>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <span>
                Session Management:
                <a href="https://redis.io/" target="_blank">Redis</a>
              </span>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>
