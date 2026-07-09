# WorHou

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
- Test & Lint 
  - supertest 
  - ava
  - c8
  - xo

Initial project setup:

```bash
#mkdir worhou
#cd worhou
npm init -y
npm pkg set type=module
npm i -D supertest ava c8 xo
npm i pg knex fastify @fastify/view pug @fastify/websocket htmx.org@4.0.0-beta5 bulma date-fns
mkdir -p app/{controllers,services,configs,models,infra,templates}
touch app/main.js
touch app/configs/db.js
touch app/infra/database.yml
touch app/templates/index.pug
```

## How to test

### Lint / format

## How to run

## Planned features

## Noteworthy
