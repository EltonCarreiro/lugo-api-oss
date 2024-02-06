FROM node:20.11.0 as base
WORKDIR /app
EXPOSE 3000
COPY package*.json ./
RUN npm ci
COPY tsconfig.json jest.config.ts drizzle.config.ts ./
COPY ./migrations ./migrations
COPY ./src ./src

FROM base as dev
WORKDIR /app
COPY --from=base ./app ./
CMD ["npm", "run", "dev"]

FROM base as prod
WORKDIR /app
COPY --from=base ./app ./
RUN npm run build
CMD ["node", "./dist/index.js"]
