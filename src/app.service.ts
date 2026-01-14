import { Injectable } from '@nestjs/common';
  //test
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
