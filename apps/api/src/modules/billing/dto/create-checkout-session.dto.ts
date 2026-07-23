import { IsIn } from 'class-validator';
import type { PaidPlanKey } from '../billing.constants';

export class CreateCheckoutSessionDto {
  @IsIn(['starter', 'pro'])
  plan!: PaidPlanKey;
}
