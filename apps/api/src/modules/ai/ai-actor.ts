/**
 * Caller identity for AI operations.
 * - member: dashboard JWT path — membership + AiRateLimiter + usage.userId
 * - organization: public widget (publishable key) — no membership/user RL; usage.userId null
 */
export type AiActor =
  | { type: 'member'; userId: string; organizationId: string }
  | { type: 'organization'; organizationId: string };

export function memberActor(userId: string, organizationId: string): AiActor {
  return { type: 'member', userId, organizationId };
}

export function organizationActor(organizationId: string): AiActor {
  return { type: 'organization', organizationId };
}

export function actorUserId(actor: AiActor): string | null {
  return actor.type === 'member' ? actor.userId : null;
}
