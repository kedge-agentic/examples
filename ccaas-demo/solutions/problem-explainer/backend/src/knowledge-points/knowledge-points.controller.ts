import { Controller, Get, Query } from '@nestjs/common';
import { KnowledgePointsService } from './knowledge-points.service';

@Controller()
export class KnowledgePointsController {
  constructor(private readonly knowledgePointsService: KnowledgePointsService) {}

  @Get('subjects')
  getSubjects() {
    return this.knowledgePointsService.getSubjects();
  }

  @Get('knowledge-points')
  getKnowledgePoints(
    @Query('subject') subject: string,
    @Query('grade') grade?: string,
  ) {
    if (!subject) {
      return { error: 'Subject is required' };
    }
    return this.knowledgePointsService.getKnowledgePoints(subject, grade);
  }

  @Get('knowledge-points/search')
  searchKnowledgePoints(
    @Query('q') query: string,
    @Query('subject') subject?: string,
  ) {
    if (!query) {
      return [];
    }
    return this.knowledgePointsService.searchKnowledgePoints(query, subject);
  }
}
