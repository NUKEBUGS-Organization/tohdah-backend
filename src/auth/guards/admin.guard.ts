import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jwtOk = await super.canActivate(context);
    if (!jwtOk) {
      return false;
    }
    const req = context.switchToHttp().getRequest<{ user: { userId: string } }>();
    const dbUser = await this.usersService.findById(req.user.userId);
    const role = dbUser?.role ?? 'user';
    if (!dbUser || (role !== 'admin' && role !== 'superadmin')) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
