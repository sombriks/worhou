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
npm i -D ava c8 xo @types/node
# all others
npm i pg knex
npm i fastify @fastify/view @fastify/static @fastify/websocket
npm i pug htmx.org@4.0.0-beta5 bulma date-fns
```

Initial skeleton:

```bash
mkdir -p app/{configs,controllers,infra,models,services,static,templates}
touch app/main.js
touch app/configs/{servier,db}.js
touch app/controllers/{person,worksheet,timelog}.js
touch app/controllers/{dashboard,notifications,onboarding}.js
touch app/infra/database.yml
touch app/models/{person,worksheet,notifications}.js
touch app/services/{person,worksheet,timelog,dashboard,notifications}.js
touch app/static/worhou.{css,js}
touch app/templates/index.pug
mkdir -p app/templates/{components,pages,layouts}
```

## Environment variables

```bash
NODE_ENV=development
BASE_URL=
DB_USER=worhou
DB_PASSWORD=
DB_PORT=5432
PORT=3000
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
docker compose -f app/infra/database.yml up -d
```

Then you're good to go:

```bash
npm run dev
```

## Planned features

1. reports
2. graphics
3. teams
4. notifications

## Noteworthy

- I am getting old, there is no need to nodemon anymore, Node.js now has a
  builtin watch function.
- Fastify [inject][fastify-inject] makes testing pretty neat.
- [Locality Of Behavior][lob] first, Single [Responsibility Principle][srp] 
  when there are too many concerns.

[fastify-inject]: https://fastify.dev/docs/latest/Guides/Testing/
[lob]: https://htmx.org/essays/locality-of-behaviour/
[srp]: https://en.wikipedia.org/wiki/Single-responsibility_principle
