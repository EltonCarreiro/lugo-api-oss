# Lugo - Simple Real Estate Office API (Open Source Version)

### 🚧 Under active development. This is in a very early stage

#### ⚠️ The main goal of this repository is to sharpen my skills by developing an app with latest technology in TypeScript/Node ecosystem. Here I'll write down dead simple code so i can ship as fast as I can without compromising code quality.

## Technologies used:

- **TypeScript**
- **Jest** - Tests and code coverage
- **GraphQL**
  - graphql-yoga - Graphql server
  - pothos-graphql - Code first graphql schema generation
- **Drizzle**
  - drizzle-orm - Type safe and lightweight ORM and query builder
  - drizzle-kit - Database migrations
- **type-coverage** - tracks properly typed
- **type-coverage-report** - Displays the output of `type-coverage` in a more human-friendly manner
- **PostgreSQL** - Store data
- **Redis** - In-memory cache mainly for auth-sessions
- **BigNumber.js** - Handles calculations so we avoid floating point issues
- **winston** - Logging framework
- **jose** - JWT signing and verification

... and more as it is developed :)

## Notes on architectural decisions

Out there we have plenty of content explaining well known architectures such as Clean Architecture, Hexagonal Architecture, Ports and Adapters pattern, etc.

This codebase aims for simplicity and all architectural decisions are based on what is truly needed from a product perspective. Here I am a big fan of the [YAGNI](https://martinfowler.com/bliki/Yagni.html) principle!

- We don't have plans to switch databases, so there isn't any data layer abstraction;
- We don't have plans to switch database frameworks, so there isn't any fancy interface for that;
- We don't have plans to provide an API other than GraphQL, so we tailor our use cases to optimize it;

So, if we don't need it, we don't build it. This way we ship faster and with less indirections. 🚀

We want to start simple and be effective, I wrote a dead simple code and project structure. I also recommend [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/), its simplicity is amazing.

## Notes on language 🇧🇷

Part of the codebase is written in English and part of the codebase is written in Portuguese. Because this API targets Brazilian real estate offices, all the domain-related code is written in Portuguese to facilitate the understanding of the concepts.

## What is Lugo:

This is Lugo Open Source Version, a lightweight API that aims to help small real state offices to register and publish their managed real estates. This repository will only include the very basic functionalities (this may be changed/extended as the app is implemented):

With lugo you can:

- Create an account;
- Create your company account and associate yours to become the company employee;
- Register the company's eployees;
- Register the company's customers (tenants or real estate owners);
- Register and associate real estate to customers;
- Create a listing for your real estate so it can be available to the public.

For the near future:

- Improve listing so you can upload images and provide more details such as amenities, inform about easy access to relevant places, etc.;
- Active a simple (polling based) chat to your listing so you can directly communicate with those who are interested in the real estate;
- Activate a simple and yet efficient visitor tracking system so you know when the real estate will have visitors and who are they.

### Developing

This repository contains all needed technologies to quickly start developing:

- Dockerfile with hot-reload support using volumes and `tsx`;
- Docker compose file that spins up api and data sources;
- Scripts to run unit tests and integration tests (with and without code coverage);
- GitHub actions to trigger build and tests, which helps with PR checks;

#### Running locally

Clone the repository:

```shell
git clone git@github.com:EltonCarreiro/lugo-api-oss.git
```

Install dependencies:

```shell
npm install
```

Spin application using docker compose:

```shell

docker-compose  up  -d

```

The API should be available on `http://localhost:3000/graphql`

### Testing

By default, the codebase requires at least 80% of code coverage. As of right now there isn't any PR check that checks it and blocks, but this is to be done eventually.

```shell
# Running unit tests
npm run test-unit

# Watching code changes

npm run test-unit -- --watchAll
npm run test-unit -- --watch ./path/to/file.test.ts

# Running integration tests
npm run test-integration

# Watching code changes

npm run test-integration -- --watchAll
npm run test-integration -- --watch ./path/to/file.int.test.ts

# Running all tests with coverage
npm run test-all-coverage
```

### Logging

The codebase uses a simple logger factory called `createLogger` which relies on `winston`. The return type only allows the `error`, `warning`, `info` and `debug` log levels.

Besides that, the logger allows the developer to include a `trace_id` so it becomes easy to group logs of the same session.

As of right now the logger outputs a colorized human-readable log, but in the near future the application will also output JSON so it works better with tools like logstash.

### Migrations

#### Running migrations

In order to run migrations, you must have a `.env` file at the root of your project. Note that it is not persisted in the repository for security reasons.

```ini
DATABASE_URL=postgres://lugo:passw0rd@localhost:5432/lugo
```

Then just run:

```shell
npm  run  migrations:run
```

#### Generating new migrations

As stated above, this app uses drizzle-orm, if you want to change the database schema, just change the `src/schema.ts` file and run:

```shell
npm  run  migration:generate
```

This will generate the new migration files which should be saved in git.

### Environment variables

Environment variables used by the application. Values are random:

```ini
DATABASE_URL=postgres://lugo:passw0rd@localhost:5432/lugo
REDIS_URL=redis://alice:foobared@awesome.redis.server:6380
SESSION_DURATION_SECONDS=86400 (Tells how long an user session lasts)
JWT_SECRET=my-jwt-secret (random secret to sign JWTs)
JWT_ALGORITHM=HS256 (algorithm used for JWT signing)
```
