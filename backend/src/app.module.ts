import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
