import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import type { RequestUser } from '../strategies/jwt-access.strategy';

/**
 * Run after {@link AdminGuard} (or any guard that populates `req.user` from JWT).
 * Requires `user.role === 'superadmin'`.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<{ user?: RequestUser }>();
    const userId = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Superadmin access required');
    }
    const u = await this.usersService.findById(userId);
    if (!u || u.role !== 'superadmin') {
      throw new ForbiddenException('Superadmin access required');
    }
    return true;
  }
}
