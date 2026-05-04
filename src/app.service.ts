import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return { service: 'tohdah-api', status: 'ok' as const };
  }
}
