import moment from 'moment';
import winston, { format, transports } from 'winston';
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp({ format: moment().format('DD.MM.YYYY, HH:mm:ss ZZ') }), myFormat),
  transports: [new transports.Console()],
});

export default logger;
