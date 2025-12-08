import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class DbMigrationService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const migrateMongo = await import('migrate-mongo');
    const config = migrateMongo.default?.config ?? migrateMongo.config;
    const database = migrateMongo.default?.database ?? migrateMongo.database;
    const up = migrateMongo.default?.up ?? migrateMongo.up;

    const dbMigrationConfig = {
      mongodb: {
        databaseName: this.configService.getOrThrow<string>('MONGODB_DATABASE'),
        url: this.configService.getOrThrow<string>('MONGODB_URI'),
      },
      migrationsDir: path.join(process.cwd(), 'migrations'),
      changelogCollectionName: 'changelog',
      migrationFileExtension: '.js',
    };

    config.set(dbMigrationConfig);
    const { db, client } = await database.connect();

    try {
      await up(db, client);
    } finally {
      await client.close();
    }
  }
}
