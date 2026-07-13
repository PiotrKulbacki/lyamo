import { z } from 'zod';

export const CATEGORY_ERROR_CODES = {
  INVALID_NAME: 'settings.categories.errors.invalidName',
  INVALID_COLOR: 'settings.categories.errors.invalidColor',
  DUPLICATE_NAME: 'settings.categories.errors.duplicateName',
  NOT_FOUND: 'settings.categories.errors.notFound',
  FORBIDDEN: 'settings.categories.errors.forbidden',
  HAS_TRANSACTIONS: 'settings.categories.errors.hasTransactions',
  INVALID_MIGRATE_TARGET: 'settings.categories.errors.invalidMigrateTarget',
  BUILT_IN_READONLY: 'settings.categories.errors.builtInReadonly',
} as const;

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, CATEGORY_ERROR_CODES.INVALID_COLOR)
  .optional()
  .nullable();

export const createUserCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, CATEGORY_ERROR_CODES.INVALID_NAME)
    .max(50, CATEGORY_ERROR_CODES.INVALID_NAME),
  color: hexColorSchema,
});

export const updateUserCategorySchema = createUserCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: CATEGORY_ERROR_CODES.INVALID_NAME });

export const deleteUserCategorySchema = z.object({
  migrateToCategory: z.string().min(1).optional(),
});

export type CreateUserCategoryInput = z.infer<typeof createUserCategorySchema>;
export type UpdateUserCategoryInput = z.infer<typeof updateUserCategorySchema>;
export type DeleteUserCategoryInput = z.infer<typeof deleteUserCategorySchema>;

export type CategoryListItem = {
  key: string;
  name: string;
  color: string;
  isCustom: boolean;
  customId?: string;
};
