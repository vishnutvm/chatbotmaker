import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok payload with service name and timestamp', () => {
    const service = new HealthService();
    const result = service.getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('genie-api');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
