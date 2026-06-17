import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthUsersController } from './auth-users.controller';
import { AuthUsersService } from './auth-users.service';
import { AuthVaultService } from './auth-vault.service';
import { AuthUsersEntity } from './entities/auth-users.entity';
import { AuthTokensEntity } from './entities/auth-tokens.entity';
import { AccessRequestEntity } from '../email/entities/access-request.entity';
import { AuthUsersRepository } from './repositories/auth-users.repository';
import { AuthTokensRepository } from './repositories/auth-tokens.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { ConfigModule } from '@nestjs/config';

const SECRET_KEY = "2c6ee24b09816a6c6de4f1d3f8c3c0a6559dca86b6f710d930d3603fdbb724";

@Module({
    imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: process.env.JWT_SECRET || SECRET_KEY, signOptions: { expiresIn: '7d' } }), TypeOrmModule.forFeature([AuthUsersEntity, AuthTokensEntity, AccessRequestEntity])],
    controllers: [AuthUsersController],
    providers: [AuthUsersService, AuthVaultService, AuthUsersRepository, AuthTokensRepository, JwtStrategy, GoogleStrategy],
    exports: [AuthUsersService, AuthVaultService, JwtModule, PassportModule]
})
export class AuthUsersModule { }
