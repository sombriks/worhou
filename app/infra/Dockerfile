# meant to run on project folder (where package.json lkives)
FROM node:24-alpine AS stage1
WORKDIR /work
COPY package*.json ./
RUN npm ci --only=production
# podman build -f app/infra/Dockerfile -t sombriks/worhou:latest
FROM node:24-alpine
WORKDIR /work
COPY --from=stage1 /work/node_modules /work/node_modules
COPY package*.json /work
COPY app /work/app
RUN chown -R node:node /work
USER node
CMD ["node", "app/main.js"]
