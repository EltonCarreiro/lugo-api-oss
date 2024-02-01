import crypto from 'crypto';

export const createMD5Hash = (
  value: string,
  digest: 'hex' | 'base64' = 'base64'
) => crypto.createHash('md5').update(value).digest(digest);
