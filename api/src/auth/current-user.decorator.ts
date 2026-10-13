import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccessUser } from './token.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AccessUser }>();
    return request.user;
  },
);
