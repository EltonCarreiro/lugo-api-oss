docker-compose up -d --build
docker-compose exec lugo-api npx tsx src/migrate.ts
docker-compose exec lugo-api npx jest --coverage false --testRegex=int\\.test\\.ts$ -w 1 --detectOpenHandles $@ && docker-compose down -v
