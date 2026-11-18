import { join } from 'path';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './database.options';

export default new DataSource({
  ...createDataSourceOptions((key) => process.env[key]),
  entities: [join(__dirname, '..', '**', '*.entity.js')],
});
