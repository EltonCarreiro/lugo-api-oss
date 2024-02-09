import { LogLevels, Logger } from '@/logging';
import { BusinessError } from './BusinessError';

export const throwBusinessErrorAndLog = (
  logFn: Logger,
  errorMessage: string,
  logLevel: LogLevels = 'warn'
) => {
  logFn[logLevel](errorMessage);
  throw new BusinessError(errorMessage);
};
