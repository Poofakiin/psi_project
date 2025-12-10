FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001
EXPOSE 3002
EXPOSE 4000

CMD ["node"]
