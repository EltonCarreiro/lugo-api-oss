import winston from 'winston';
const { combine, colorize, timestamp, printf, metadata } = winston.format;

const addTraceId = winston.format((info, opts) => {
  if (opts.trace_id !== undefined) {
    info.trace_id = opts.trace_id;
  }

  return info;
});

const customFormat = printf((info) => {
  const { level, message, metadata } = info;
  return `[${metadata.timestamp}] ${metadata.trace_id ? `[${metadata.trace_id}]` : ''} ${level}: - ${message}`;
});

interface CreateLoggerArgs {
  trace_id: string;
}

export type LogLevels = 'error' | 'warn' | 'info' | 'debug';
export type Logger = Record<LogLevels, winston.LeveledLogMethod>;

// export type Logger = ReturnType<typeof createLogger>;

export const createLogger = (args?: CreateLoggerArgs): Logger => {
  const logger = winston.createLogger({
    level: 'debug',
    levels: winston.config.npm.levels,
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      addTraceId({ trace_id: args?.trace_id }),
      metadata(),
      customFormat
    ),
    transports: [new winston.transports.Console()]
  });

  return logger;
};
