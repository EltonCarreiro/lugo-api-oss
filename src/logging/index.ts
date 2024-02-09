import winston from 'winston';
const { combine, colorize, timestamp, printf, metadata } = winston.format;

const customFormat = printf((info) => {
  const { level, message, timestamp } = info;
  return `[${timestamp}] ${level}: - ${message}`;
});

export const createLogger = () => {
  const logger = winston.createLogger({
    level: 'debug',
    levels: winston.config.npm.levels,
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      metadata(),
      customFormat
    ),
    transports: [new winston.transports.Console()]
  });

  return logger;
};
