import { Module, forwardRef } from '@nestjs/common';
import { TohdahGateway } from './tohdah.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [TohdahGateway],
  exports: [TohdahGateway],
})
export class GatewayModule {}
