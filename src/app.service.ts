import { Injectable } from '@nestjs/common';
  //testtest
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
