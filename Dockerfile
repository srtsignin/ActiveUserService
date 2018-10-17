FROM node:8.12.0-alpine

WORKDIR /

COPY package*.json .
COPY active_user_service.js .
COPY config.json .
COPY node_modules .

EXPOSE 3000

CMD node active_user_service.js