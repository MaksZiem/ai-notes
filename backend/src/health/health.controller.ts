import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Stan aplikacji',
    description:
      'Sprawdza połączenie z bazą danych. Zwraca 503, gdy baza nie odpowiada.',
  })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
