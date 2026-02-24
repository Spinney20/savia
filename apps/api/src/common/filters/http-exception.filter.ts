import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ApiError } from '@ssm/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiError = {
      statusCode: status,
      message: 'Eroare internă de server',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        body = { statusCode: status, message: res };
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        body = {
          statusCode: status,
          message: (obj.message as string) ?? exception.message,
          error: obj.error as string | undefined,
          details: obj.details as Record<string, string[]> | undefined,
        };
      }
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json(body);
  }
}
