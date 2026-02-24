import { Controller, Get, Patch, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import type { AuthUser } from '@ssm/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('MUNCITOR')
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, unknown>) {
    return this.notificationsService.list(user, query);
  }

  @Get('unread-count')
  @Roles('MUNCITOR')
  async getUnreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.notificationsService.getUnreadCount(user);
    return { count };
  }

  @Patch(':uuid/read')
  @Roles('MUNCITOR')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@CurrentUser() user: AuthUser, @Param('uuid', ParseUuidPipe) uuid: string) {
    await this.notificationsService.markAsRead(user, uuid);
    return { message: 'Notificarea a fost marcată ca citită.' };
  }
}
