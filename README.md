# Lugo - Simple Real Estate Office API (Open Source Version)

### 🚧 Under active development. This is in a very early stage

#### ⚠️ The main goal of this repository is to sharpen my skills by developing an app with latest technology in TypeScript/Node ecosystem. Here I'll write down dead simple code so i can ship as fast as I can without compromising code quality.

## Technologies used:

- **TypeScript**
- **Jest**
- **GraphQL**
  - graphql-yoga (graphql server)
  - pothos-graphql (code first schema)
- **Drizzle**
  - drizzle-orm (type safe and lightweight ORM and query builder);
  - drizzle-kit (database migrations)
- **type-coverage** and **type-coverage-report** (keeps track of properly typed code)
- **PostgreSQL**
- **BigNumber.js** (handles floating point numbers)

... and more as it is developed :)

## Notes on architectural decisions

Out there we have plenty of content explaining well known architectures such as Clean Architecture, Hexagonal Architecture, Ports and Adapters pattern, etc.

This codebase aims for simplicity and all architectural decisions are based on what is truly needed from a product perspective. Here I am a big fan of the [YAGNI](https://martinfowler.com/bliki/Yagni.html) principle!

- We don't have plans to switch databases, so there isn't any data layer abstraction;
- We don't have plans to switch database frameworks, so there isn't any fancy interface;
- We don't have plans to provide an API other than GraphQL, so we tailor our use cases to optimize it;

So, if we don't need it, we don't build it. This way we ship faster, with less indirections, and less concepts to wrap our head around. 🚀

We want to start simple and be effective, so we write dead simple code and project structure. I also recommend [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/), its simplicity is amazing!

## What is Lugo:

This is Lugo Open Source Version, a lightweight API that aims to help small real state offices to register and publish their managed real estates. This repository will only include the very basic functionalities (this may be changed/extended as the app is implemented):

- Create personal account;
- Register and manage real estates;
- Register and manage real estate listings;

### Development

This repository contains all needed technologies to quickly start developing:

- Dockerfile with `development` and `production` targets;
- Docker compose file that spins up both api and PostgreSQL database;
- `tsx` to easily run and live reload the code as you develop;

#### Running locally

Spin up API and database using docker-compose:

```shell
docker-compose up -d
```

Or if you prefer, run it directly (must have a running database):

```shell
DATABASE_URL=postgres://lugo:passw0rd@localhost:5432/lugo npm run dev
```

#### Running migrations

In order to run migrations, you must have a `.env` file at the root of your project. Note that it is not persisted in the repository for security reasons:

```ini
DATABASE_URL=postgres://lugo:passw0rd@localhost:5432/lugo
```

Then just run:

```shell
npm run migrations:run
```

#### Generating new migrations

As stated above, this app uses drizzle-orm, if you want to change the database schema, just change the `src/schema.ts` file and run:

```shell
npm run migration:generate
```

### Deploying to Production

This repository does not offer any helper or infrastructure to deploy the app on production, what is relevant here is that you must provide all relevant environment variables for the API to run.
