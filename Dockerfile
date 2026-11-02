FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY public/ ./public/
COPY server.js ./
EXPOSE 45867
CMD ["node", "server.js"]