import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Optional } from '@nestjs/common';
import { LogsService } from '../../logs/logs.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Optional() private logsService?: LogsService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    }

    const responseMessage =
      typeof message === 'string' ? message : message.message || message;

    // Log error to database (non-blocking — don't await to avoid feedback loop)
    if (this.logsService && status >= 400) {
      const userId = (request as any).user?.id;
      this.logsService.create({
        method: request.method,
        url: request.url,
        statusCode: status,
        message: typeof responseMessage === 'string' ? responseMessage : JSON.stringify(responseMessage),
        stack: stack,
        body: request.method !== 'GET' ? JSON.stringify((request as any).body) : undefined,
        userId,
      }).catch(() => {}); // silently ignore log failures
    }

    response.status(status).json({
      statusCode: status,
      message: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
