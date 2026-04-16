FROM node:20-alpine

# Install ffmpeg for media analysis
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
