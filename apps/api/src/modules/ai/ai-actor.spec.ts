import {
  actorUserId,
  memberActor,
  organizationActor,
  type AiActor,
} from './ai-actor';

describe('ai-actor', () => {
  it('builds member and organization actors', () => {
    const member = memberActor('user-1', 'org-1');
    const org = organizationActor('org-2');

    expect(member).toEqual({
      type: 'member',
      userId: 'user-1',
      organizationId: 'org-1',
    });
    expect(org).toEqual({
      type: 'organization',
      organizationId: 'org-2',
    });
  });

  it('returns userId for member actors and null for organization actors', () => {
    const member: AiActor = memberActor('user-9', 'org-9');
    const org: AiActor = organizationActor('org-9');

    expect(actorUserId(member)).toBe('user-9');
    expect(actorUserId(org)).toBeNull();
  });
});
