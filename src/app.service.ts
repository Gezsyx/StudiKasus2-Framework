import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'API kamu sudah berjalan dengan baik, selamat berbelanja!';
  }
}
