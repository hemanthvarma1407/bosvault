export default () => ({
    database: {
        type: 'postgres' as const,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        dbName: process.env.DB_DATABASE || 'bosvault',
        poolLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
    },
    app: {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    jwt: {
        secret: process.env.JWT_SECRET || "2c6ee24b09816a6c6de4f1d3f8c3c0a6559dca86b6f710d930d3603fdbb724",
    },
});
