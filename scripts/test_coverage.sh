docker-compose up -d --build
docker-compose exec -T lugo-api npx tsx src/migrate.ts
docker-compose exec -T lugo-api npx jest --testRegex=\\.test\\.ts$ -w 1 $@ && docker-compose down -v
