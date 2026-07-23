import { NotFoundException } from '@nestjs/common';
import { WidgetBootstrapService } from './widget-bootstrap.service';

describe('WidgetBootstrapService', () => {
  let assistantsService: { getLivePublicDisplay: jest.Mock };
  let publishableKeysService: { markUsed: jest.Mock };
  let rateLimiter: { assertBootstrap: jest.Mock };
  let service: WidgetBootstrapService;

  beforeEach(() => {
    assistantsService = { getLivePublicDisplay: jest.fn() };
    publishableKeysService = { markUsed: jest.fn().mockResolvedValue(undefined) };
    rateLimiter = { assertBootstrap: jest.fn() };
    service = new WidgetBootstrapService(
      assistantsService as never,
      publishableKeysService as never,
      rateLimiter as never,
    );
  });

  it('returns public display and marks key used', async () => {
    assistantsService.getLivePublicDisplay.mockResolvedValue({
      assistantId: 'asst-1',
      organizationId: 'org-1',
      name: 'Bot',
      welcomeMessage: 'Hi',
      appearance: {},
    });

    const result = await service.bootstrap(
      { keyId: 'key-1', organizationId: 'org-1' },
      'asst-1',
    );

    expect(rateLimiter.assertBootstrap).toHaveBeenCalledWith('key-1');
    expect(assistantsService.getLivePublicDisplay).toHaveBeenCalledWith('org-1', 'asst-1');
    expect(result.name).toBe('Bot');
    expect(publishableKeysService.markUsed).toHaveBeenCalledWith('key-1');
  });

  it('throws 404 when assistant is not live/same-org', async () => {
    assistantsService.getLivePublicDisplay.mockResolvedValue(null);
    await expect(
      service.bootstrap({ keyId: 'key-1', organizationId: 'org-1' }, 'asst-x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
