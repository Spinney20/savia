import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;

    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_root';
        if (!details[key]) details[key] = [];
        details[key].push(issue.message);
      }
      throw new BadRequestException({
        statusCode: 400,
        message: 'Eroare de validare',
        error: 'Bad Request',
        details,
      });
    }
    return result.data;
  }
}
