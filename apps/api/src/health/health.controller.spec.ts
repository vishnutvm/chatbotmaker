import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok health payload', () => {
    const result = controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('genie-api');
    expect(result.timestamp).toBeDefined();
  });

  it('returns version payload', () => {
    const result = controller.getVersion();
    expect(result.service).toBe('genie-api');
    expect(result.gitShaShort).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
});
