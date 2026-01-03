export class BaseResponseDto<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];

  constructor(success: boolean, data?: T, message?: string, errors?: string[]) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.errors = errors;
  }

  static success<T>(data: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }

  static error(message: string, errors?: string[]): BaseResponseDto<null> {
    return new BaseResponseDto(false, null, message, errors);
  }
}
