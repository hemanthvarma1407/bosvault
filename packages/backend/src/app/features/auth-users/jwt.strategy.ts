import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { IUserPayload } from '../../interfaces/auth.interface';

const SECRET_KEY = "2c6ee24b09816a6c6de4f1d3f8c3c0a6559dca86b6f710d930d3603fdbb724";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: process.env.JWT_SECRET || SECRET_KEY });
    }

    async validate(payload: { sub: number, email: string, companyId: number, role: string, roles?: string[] }): Promise<IUserPayload> {
        return { userId: payload.sub, email: payload.email, companyId: payload.companyId, role: payload.role, roles: payload.roles };
    }
}
