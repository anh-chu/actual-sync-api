FROM node:18-bullseye as base
WORKDIR /app
ADD yarn.lock package.json ./
RUN yarn install --all --frozen-lockfile
ADD tsconfig.json .
ADD src .
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile

FROM node:18-bullseye-slim as prod
RUN apt-get update && apt-get install tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/
COPY --from=base /app/package.json ./
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
EXPOSE 5007
ENV NODE_ENV=production
CMD ["node", "app.js"]