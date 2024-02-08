docker-compose up -d --build
docker-compose exec lugo-api npx tsx src/migrate.ts
docker-compose exec lugo-api npx jest --testRegex=\\.test\\.ts$
docker-compose down -v
