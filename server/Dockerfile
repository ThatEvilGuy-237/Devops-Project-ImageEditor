FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache netcat-openbsd
# install packlages
COPY package*.json ./
RUN npm install

# Copy program in to container
COPY . .

# wait for db to start(has init file for db)
RUN chmod +x wait-for-it.sh

EXPOSE 3000

CMD ["./wait-for-it.sh", "db", "node", "server.js"]
