docker-compose up -d --build
docker-compose exec lugo-api npx jest --testRegex=\\.test\\.ts$

