import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';

type EnvGetter = (key: string) => string | undefined;

export function createDataSourceOptions(get: EnvGetter): DataSourceOptions {
  return {
    type: 'postgres',
    host: get('DB_HOST'),
    port: Number(get('DB_PORT') ?? 5432),
    username: get('DB_USER'),
    password: get('DB_PASS'),
    database: get('DB_NAME'),
    migrations: [join(__dirname, 'migrations', '*.js')],
    synchronize: get('DB_SYNCHRONIZE') === 'true',
  };
}
