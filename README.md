# [WorHou][repo]

[![Node.js CI][badge]][workflow]

[badge]: https://github.com/sombriks/worhou/actions/workflows/test.yml/badge.svg
[workflow]: https://github.com/sombriks/worhou/actions/workflows/test.yml
[repo]: https://github.com/sombriks/worhou

Working hours sample app

## Tech stack

- Runtimes
    - docker 29 (or podman 5.8)
    - node 24
    - postgres 18
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
- Production infrastructure
    - podman compose
    - caddy

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
npm i pug htmx.org@4.0.0 bulma
npm i @date-fns/cdn date-fns alpinejs
```

Initial skeleton:

```bash
mkdir -p app/{configs,controllers,infra,models,services,static}
mkdir -p app/templates/{components,pages,layouts,partials}
mkdir -p app/migrations/{common,development,production/test}
touch app/main.js
touch app/configs/{server,database,auth}.js
touch app/controllers/{onboarding,profile,teams,timelog,worksheet}.js
touch app/infra/database.yml
touch app/models/{logins,timelogs,users,worksheets}.js
touch app/services/{onboarding,profile,teams,timelog,worksheet}.js
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
HOST=0.0.0.0
AUTH_KEY=
AUTH_EXPIRES_IN=1d
PG_DATA=../../pg-data
EMAIL_API_URL=
EMAIL_API_USERNAME=
EMAIL_API_PASSWORD=
```

## How to test

```bash
npm run test
```

### Lint and format

```bash
npm run lint
```

## How to run

If you don't have a database, spin-up one with docker or podman:

```bash
# docker compose -f app/infra/database.yml up
npm run db:up
```

Then you're good to go:

```bash
npm run dev
```

## How to create database migrations

First provision an empty migration file:

```bash
npm run migration:make migration_file_name
```

Then go to `app/migrations/common` directory and work on the generated template,
using the [knex schema][knex-schema] api to evolve the database.

[knex-schema]: https://knexjs.org/guide/schema-builder.html

## How to build the container image

Use either docker or podman:

```bash
# docker build -f app/infra/Dockerfile -t sombriks/worhou:latest .
podman build -f app/infra/Dockerfile -t sombriks/worhou:latest .
```

## How to run it with podman compose + caddy

First, install and configure caddy in the server.

```bash
sudo dnf install caddy
sudo systemctl enable caddy
sudo service caddy start
```

Next, run the setup script to configure caddy, cron and podman.

```bash
chmod +x app/infra/setup.sh
./app/infra/setup.sh
```

The production compose can be tested like this:

```bash
#docker compose --env-file=.env -f app/infra/production.yml up
podman compose --env-file=.env -f app/infra/production.yml up
```

## Planned features

1. [X] basic clock in / clock out
2. [X] simple device login
3. [X] simple email login
4. [ ] timesheet configuration
5. [X] export reports (csv)
6. [ ] cool graphics and stats
7. [ ] teams
8. [ ] publish (address coming soon)
9. [ ] social login

## Noteworthy

- I am getting old, there is no need to install [nodemon][nodemon], Node.js now
  has a watch mode.
- Fastify [inject][fastify-inject] makes testing pretty neat.
- [Locality Of Behavior][lob] first, Single [Responsibility Principle][srp]
  when there are too many concerns.
- [Subpath patterns][subpath] are cool.
- Mind the app and database timezones.
- [Caddy][caddy] is easy and cool.
- Not everything needs kubernetes. Sometimes a simple [compose][compose] file
  does the job.
- Kudos to [mailjet][mailjet], quise simple setup.

[nodemon]: https://nodemon.io/
[fastify-inject]: https://fastify.dev/docs/latest/Guides/Testing/
[lob]: https://htmx.org/essays/locality-of-behaviour/
[srp]: https://en.wikipedia.org/wiki/Single-responsibility_principle
[subpath]: https://nodejs.org/api/packages.html#subpath-patterns
[caddy]: https://caddyserver.com/
[compose]: https://podman-desktop.io/docs/compose
[mailjet]: https://www.mailjet.com/
