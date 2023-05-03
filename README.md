# Kanban Board by Stephen Pinto

Live verison available at: [https://kanban-board-jspb.onrender.com](https://kanban-board-jspb.onrender.com)

## About

A web application implementing a simple Kanban Board. A non-trival application showcasing both front end and back end development.

## Features

- Create/Delete boards
- Add/remove users to/from boards
- Create/Delete tasks
- Assign users to tasks
- Move tasks between the TODO, WIP, and Done states

## Technology

- Front end: [Quasar Framework](https://quasar.dev/) (based on [Vue.js v3](https://vuejs.org/))
- Back end: custom built with [Express JS](https://expressjs.com/)
- Database: [PostgreSQL](https://www.postgresql.org/)
- Session Management: [Redis](https://redis.io/)

## Inital Setup

### Clone Repo and Install Dependencies

```bash
git clone https://github.com/stephenpinto7/kanban-board.git
npm install
```

### Run Databases

The databases can be run with [Docker Compose](https://docs.docker.com/compose/compose-file/). For the first run you can create the containers like so:

```bash
docker compose up
```

Afterwards you can stop the containers with:

```bash
docker compose stop
```

And you can restart them with:

```bash
docker compose start
```

### Back End

The webserver can be started with:

```bash
node server.js
```

### Front End

The front end dev sever can be started with:

```bash
npx quasar dev
```

## Build the app for production

```bash
quasar build
```
