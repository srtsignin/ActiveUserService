FROM node:8.12.0-alpine

WORKDIR /runner

ADD package*.json /runner/
RUN npm install

ADD active_user_service.js /runner

ADD Courses_by_department.json /runner
ADD Courses.json /runner

EXPOSE 3000

CMD node active_user_service.js