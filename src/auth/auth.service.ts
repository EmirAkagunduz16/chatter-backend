import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { User } from 'src/users/entities/user.entity';
import { TokenPayload } from './token-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: User, response: Response) {
    const expires = new Date();
    expires.setSeconds(
      expires.getSeconds() + this.configService.getOrThrow('JWT_EXPIRATION'),
    );

    const tokenPayload: TokenPayload = {
      _id: user._id.toHexString(),
      email: user.email,
      username: user.username,
    };

    const token = await this.jwtService.signAsync(tokenPayload);

    response.cookie('Authentication', token, {
      httpOnly: true,
      expires,
    });
  }

  verifyWs(request: Request): TokenPayload {
    const cookies: string[] | undefined = request.headers.cookie?.split('; ');
    const authCookie = cookies?.find((cookie) =>
      cookie.includes('Authentication'),
    );
    const jwt = authCookie?.split('Authentication=')[1];
    return this.jwtService.verify(jwt!);
  }

  logout(response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      expires: new Date(),
    });
  }
}
