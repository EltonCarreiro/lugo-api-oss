import { createClient } from 'redis';

export type RedisClient = Awaited<ReturnType<typeof createClient>>;

let client: RedisClient | undefined;

export const getRedisClient = async (): Promise<RedisClient> => {
  if (client !== undefined) {
    return client;
  }

  client = await createClient({
    url: process.env.REDIS_URL
  })
    .on('error', (err) => console.log('Redis Client Error', err))
    .connect();

  return client;
};
