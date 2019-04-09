FROM node:10.5.0

RUN mkdir -p /app

COPY ./src /app/src
COPY ./scripts /app/scripts
COPY ./package.json /app/package.json
