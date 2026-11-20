FROM node:24-alpine AS public-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY public/ ./public/
COPY scripts/build/ ./scripts/build/
RUN node scripts/build/minify-public.js

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY --from=public-build /app/build/public ./public
EXPOSE 45867
CMD ["node", "server.js"]