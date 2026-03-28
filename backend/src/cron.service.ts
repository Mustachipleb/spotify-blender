import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  constructor() {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    console.log('Running a task every 30 seconds');
  }
}
