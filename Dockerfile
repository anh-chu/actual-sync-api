FROM node:18-bullseye as base
WORKDIR /app
ADD package*.json .
RUN npm ci
ADD tsconfig.json .
ADD src .
RUN npm run build

FROM node:18-bullseye-slim as prod
RUN apt-get update && apt-get install tini && apt-get clean -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/
ADD package.json ./
ENTRYPOINT ["/usr/bin/tini","-g",  "--"]
EXPOSE 5007
ENV NODE_ENV=production
CMD ["node", "app.js"]