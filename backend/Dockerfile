# Multi-stage build: compile TypeScript first, then ship only what is needed to run
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Uploaded files (avatars) go here. The app runs as the "node" user, so it must own the folder.
RUN mkdir -p /app/uploads/avatars && chown -R node:node /app/uploads
USER node
EXPOSE 5000
CMD ["node", "dist/server.js"]
