import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';

export interface KnowledgePoint {
  id: string;
  subject: string;
  grade?: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: KnowledgePoint[];
}

@Injectable()
export class KnowledgePointsService {
  private knowledgePointsCache: Map<string, KnowledgePoint[]> = new Map();

  constructor(private configService: ConfigService) {
    this.loadKnowledgePoints();
  }

  private loadKnowledgePoints() {
    const dataDir = path.join(process.cwd(), '..', 'data', 'knowledge-points');

    if (!fs.existsSync(dataDir)) {
      console.warn('Knowledge points data directory not found:', dataDir);
      return;
    }

    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const subject = file.replace('.json', '');
          const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
          const data = JSON.parse(content);
          this.knowledgePointsCache.set(subject, data.knowledgePoints || []);
        } catch (error) {
          console.warn('Failed to load knowledge points from', file, error);
        }
      }
    }
  }

  getSubjects() {
    return this.configService.getSubjects();
  }

  getKnowledgePoints(subject: string, grade?: string): KnowledgePoint[] {
    const points = this.knowledgePointsCache.get(subject) || [];

    if (grade) {
      return points.filter((p) => !p.grade || p.grade === grade);
    }

    return points;
  }

  searchKnowledgePoints(
    query: string,
    subject?: string,
  ): KnowledgePoint[] {
    const results: KnowledgePoint[] = [];
    const lowerQuery = query.toLowerCase();

    const subjects = subject
      ? [subject]
      : Array.from(this.knowledgePointsCache.keys());

    for (const subj of subjects) {
      const points = this.knowledgePointsCache.get(subj) || [];
      for (const point of points) {
        if (
          point.name.toLowerCase().includes(lowerQuery) ||
          point.description?.toLowerCase().includes(lowerQuery)
        ) {
          results.push(point);
        }
      }
    }

    return results.slice(0, 20);
  }
}
