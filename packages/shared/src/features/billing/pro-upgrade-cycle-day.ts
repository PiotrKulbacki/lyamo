import { z } from 'zod';
import { FINANCIAL_MONTH_DAY_MAX, FINANCIAL_MONTH_DAY_MIN } from './financial-month';

export const PRO_UPGRADE_CYCLE_DAY_ERROR_CODES = {
  NOT_PENDING: 'billing.errors.cycleDayChoiceNotPending',
  INVALID_DAY: 'settings.errors.invalidFinancialDay',
} as const;

export const confirmProUpgradeCycleDaySchema = z.discriminatedUnion('choice', [
  z.object({
    choice: z.literal('keep_previous'),
  }),
  z.object({
    choice: z.literal('set_custom'),
    day: z
      .number({ invalid_type_error: PRO_UPGRADE_CYCLE_DAY_ERROR_CODES.INVALID_DAY })
      .int(PRO_UPGRADE_CYCLE_DAY_ERROR_CODES.INVALID_DAY)
      .min(FINANCIAL_MONTH_DAY_MIN, PRO_UPGRADE_CYCLE_DAY_ERROR_CODES.INVALID_DAY)
      .max(FINANCIAL_MONTH_DAY_MAX, PRO_UPGRADE_CYCLE_DAY_ERROR_CODES.INVALID_DAY),
  }),
]);

export type ConfirmProUpgradeCycleDayInput = z.infer<typeof confirmProUpgradeCycleDaySchema>;
