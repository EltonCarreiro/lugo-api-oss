import { setup } from '@/graphql';

const jwtSecret = process.env.JWT_SECRET ?? '';
const jwtAlgorithm = process.env.JWT_ALGORITHM ?? '';

setup({
  algorithm: jwtAlgorithm,
  secret: jwtSecret
});
