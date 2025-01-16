FROM node:16-alpine

LABEL org.opencontainers.image.title="DittoVC" \
      org.opencontainers.image.description="A simpler way to manage Discord voice chats" \
      org.opencontainers.image.authors="@shane on Discord"

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY . .

USER node

COPY --chown=node:node . .

RUN npm install
RUN { npm audit fix || true; }

ENTRYPOINT ["node", "index.js"]