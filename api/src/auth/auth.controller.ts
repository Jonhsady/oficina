import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { parseBody } from '../common/zod';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { Public } from './public.decorator';
import type { AccessUser } from './token.service';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'bruno.tecnico@oficina.local' },
        password: { type: 'string', example: 'oficina123' },
      },
    },
  })
  login(@Body() body: unknown) {
    const input = parseBody(credentialsSchema, body);
    return this.auth.login(input.email, input.password);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: unknown) {
    const input = parseBody(refreshSchema, body);
    return this.auth.refresh(input.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  logout(@Body() body: unknown) {
    const input = parseBody(refreshSchema, body);
    return this.auth.logout(input.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: AccessUser) {
    return this.auth.me(user.sub);
  }
}
