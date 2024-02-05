import { setup } from '@/graphql';

const jwtSecret = process.env.JWT_SECRET ?? '';
const jwtAlgorithm = process.env.JWT_ALGORITHM ?? '';
const sessionDurationInSeconds = Number(process.env.SESSION_DURATION_SECONDS);

if (isNaN(sessionDurationInSeconds)) {
  throw new Error(
    `Invalid session duration. Value: ${process.env.SESSION_DURATION_SECONDS}`
  );
}

setup(
  {
    algorithm: jwtAlgorithm,
    secret: jwtSecret
  },
  sessionDurationInSeconds
);
