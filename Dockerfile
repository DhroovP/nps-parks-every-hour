FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install -g typescript

RUN npx tsc

# Weird Azure error fix
ENV TMPDIR=/tmp
RUN mkdir -p /tmp

EXPOSE 8080

CMD ["node", "dist/bot.js"]
