FROM node:8.12.0-alpine

WORKDIR /

COPY . .

EXPOSE 3000

CMD node active_user_service.js