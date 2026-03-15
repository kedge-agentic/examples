import { Controller, Get, Param, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':sessionId/messages')
  async getMessages(
    @Param('sessionId') sessionId: string,
    @Query('includeToolEvents') includeToolEvents?: string,
  ) {
    const include = includeToolEvents === 'true';
    return this.sessionsService.getMessages(sessionId, include);
  }
}
