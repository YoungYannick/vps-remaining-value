FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY public/ ./public/
COPY server.js ./
EXPOSE 45867
CMD ["npm", "run", "run"]