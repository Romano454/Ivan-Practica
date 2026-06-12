import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessEvent, AccessLog } from './access-log.entity';
import { parseBrowser } from './browser-parser';

@Injectable()
export class AccessLogsService {
  constructor(
    @InjectRepository(AccessLog) private readonly repo: Repository<AccessLog>,
  ) {}

  async record(
    userId: number,
    event: AccessEvent,
    ip: string,
    userAgent: string,
  ): Promise<AccessLog> {
    const log = this.repo.create({
      userId,
      event,
      ip,
      browser: parseBrowser(userAgent),
    });
    return this.repo.save(log);
  }

  findAll(): Promise<AccessLog[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }
}
