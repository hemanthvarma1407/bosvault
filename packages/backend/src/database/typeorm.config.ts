import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envName = process.env.NODE_ENV === 'production' ? 'live' : 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `documents/environments/${envName}.env`), override: true });

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
        return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', ''),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', ''),
            password: configService.get<string>('DB_PASSWORD', ''),
            database: configService.get<string>('DB_DATABASE', ''),
            synchronize: true,
            logging: false,
            autoLoadEntities: true,
            ssl: configService.get<string>('DB_HOST')?.includes('aivencloud.com') || configService.get<string>('DB_HOST')?.includes('database.azure.com')
                ? { rejectUnauthorized: false }
                : false,
        };
    },
};
