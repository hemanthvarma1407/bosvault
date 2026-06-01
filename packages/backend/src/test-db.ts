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
    
    try {
        const tickets = await dataSource.query(`SELECT id, ticket_code, employee_id, company_id, subject, ticket_status FROM tickets`);
        console.log("TICKETS IN DB:", JSON.stringify(tickets, null, 2));
    } catch (e) {
        console.error("Tickets error:", e);
    }

    try {
        const companies = await dataSource.query(`SELECT id, company_name FROM company_info`);
        console.log("COMPANIES IN DB:", JSON.stringify(companies, null, 2));
    } catch (e) {
        console.error("Companies error:", e);
    }

    try {
        const employees = await dataSource.query(`SELECT id, first_name, last_name, email, company_id FROM employees`);
        console.log("EMPLOYEES IN DB:", JSON.stringify(employees, null, 2));
    } catch (e) {
        console.error("Employees error:", e);
    }

    try {
        const auth_users = await dataSource.query(`SELECT id, email, company_id, role FROM auth_users`);
        console.log("AUTH_USERS IN DB:", JSON.stringify(auth_users, null, 2));
    } catch (e) {
        console.error("AuthUsers error:", e);
    }

    await dataSource.destroy();
}

run().catch(console.error);
