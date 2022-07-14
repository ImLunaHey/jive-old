import chalk from 'chalk';

export const logger = {
    debug(message: string, ...optionalParams: unknown[]) {
        console.debug(`${chalk.green('[DEBUG]')} ${message}`, ...optionalParams);
    },
    info(message: string, ...optionalParams: unknown[]) {
        console.info(`${chalk.cyan('[INFO]')} ${message}`, ...optionalParams);
    },
    warn(message: string, ...optionalParams: unknown[]) {
        console.warn(`${chalk.yellow('[WARN]')} ${message}`, ...optionalParams);
    },
    error(messageOrError: string | Error, ...optionalParams: unknown[]) {
        console.error(`${chalk.red('[ERROR]')} ${messageOrError}`, ...optionalParams);
    }
};
