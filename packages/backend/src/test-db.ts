import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../documents/environments/dev.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: (process.env.DB_HOST?.includes('aivencloud.com') || process.env.DB_HOST?.includes('database.azure.com')) ? { rejectUnauthorized: false } : false,
});

async function run() {
    await dataSource.initialize();
    console.log("Connected");
    
    const count = await dataSource.query(`SELECT COUNT(*) FROM employees`);
    console.log("Total employees in DB:", count);
    
    const countWithCompany = await dataSource.query(`SELECT COUNT(*) FROM employees WHERE company_id = 1`);
    console.log("Total employees in DB with company 1:", countWithCompany);
    
    const data = await dataSource.query(`SELECT * FROM employees`);
    console.log("Employees data:", data);

    await dataSource.destroy();
}

run().catch(console.error);
