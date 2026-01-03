import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseResponseDto } from '../dto/base-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let errors: string[] = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, any>;
      message = responseObj.message || message;

      // Handle validation errors
      if (Array.isArray(responseObj.message)) {
        errors = responseObj.message;
        message = 'Validation failed';
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    const errorResponse = BaseResponseDto.error(message, errors);

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    const errorResponse = BaseResponseDto.error(message);

    response.status(status).json(errorResponse);
  }
}
