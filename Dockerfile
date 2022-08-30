# syntax=docker/dockerfile:1

FROM node:18.8.0
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --omit-dev

COPY [ "server.js", "./"]

EXPOSE 3000

CMD [ "node", "server.js" ]