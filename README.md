# [WorHou][repo]

[repo]: https://github.com/sombriks/worhou

Working hours sample app

## Tech stack

- Runtimes
    - postgres 18
    - docker 29
    - node 24
- Frameworks
    - knex
    - fastify
    - pug
    - htmx
    - bulma
    - date-fns
- Test & Lint frameworks
    - testcontainers
    - ava
    - c8
    - xo

### Initial project setup:

Project bootstrap:

```bash
mkdir worhou
cd worhou
npm init -y
npm pkg set type=module
npm pkg set license=MIT
npm pkg set main="app/main.js"
npm pkg set engines.node=">=24"
```

Dependencies:

```bash
# development
npm i -D @testcontainers/postgresql @types/knex @types/node
npm i -D ava c8 js-yaml xo
# all others
npm i pg knex
npm i fastify @fastify/view @fastify/static @fastify/websocket
npm i pug htmx.org@4.0.0-beta5 bulma
npm i @date-fns/cdn date-fns
```

Initial skeleton:

```bash
mkdir -p app/{configs,controllers,infra,models,services,static}
mkdir -p app/templates/{components,pages,layouts}
mkdir -p app/migrations/{common,development,production/test}
touch app/main.js
touch app/configs/{server,database,auth}.js
touch app/controllers/{person,worksheet,timelog}.js
touch app/controllers/{dashboard,notifications,onboarding}.js
touch app/infra/database.yml
touch app/models/{person,worksheet,notifications}.js
touch app/services/{person,worksheet,timelog,dashboard,notifications}.js
touch app/static/worhou.{css,js}
touch app/templates/index.pug
```

## Environment variables

```bash
NODE_ENV=development
BASE_URL=
DB_USER=worhou
DB_PASSWORD=
DB_PORT=5432
PORT=3000
AUTH_KEY=
```

## How to test

```bash
npm run test
```

### Lint / format

```bash
npm run lint
```

## How to run

Case you don't have a database, spin one up with docker:

```bash
# docker compose -f app/infra/database.yml up -d
npm run db:up
```

Then you're good to go:

```bash
npm run dev
```

## How to create database migrations

First provision an empty migration file:

```agsl
npm run migration:make migration_file_name
```

Then go to `app/migrations/common` directory and work on the generated 
template, using the [knex schema][knex-schema] api to evolve the database.

[knex-schema]: https://knexjs.org/guide/schema-builder.html

## Planned features

1. basic clock in / clock out
2. timesheet configuration
3. export reports
4. cool graphics
5. teams
6. notifications

## Noteworthy

- I am getting old, there is no need to nodemon, Node.js now has a watch mode.
- Fastify [inject][fastify-inject] makes testing pretty neat.
- [Locality Of Behavior][lob] first, Single [Responsibility Principle][srp]
  when there are too many concerns.
- 

[fastify-inject]: https://fastify.dev/docs/latest/Guides/Testing/
[lob]: https://htmx.org/essays/locality-of-behaviour/
[srp]: https://en.wikipedia.org/wiki/Single-responsibility_principle
