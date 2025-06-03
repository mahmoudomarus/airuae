import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../elasticsearch/elasticsearch.module';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [PrismaModule, SearchModule, GeocodingModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
