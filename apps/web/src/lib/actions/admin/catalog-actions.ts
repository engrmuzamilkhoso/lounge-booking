'use server';

import {
  cardSchema,
  type CardValues,
  faqQuestionSchema,
  type FaqQuestionValues,
  membershipTypeSchema,
  type MembershipTypeValues,
  productCategorySchema,
  type ProductCategoryValues,
  productSchema,
  type ProductValues,
  serviceSchema,
  type ServiceValues,
} from '../../validation/admin';
import { type ActionResult, actionFailure, validationFailure } from '../action-result';
import { isValidId, saveRecord } from './save-record';

const INVALID_ID = 'This record cannot be saved.';

/** Optional text: empty becomes "not set" so the API keeps it null. */
function optional(value: string): string | undefined {
  return value === '' ? undefined : value;
}

export async function saveServiceAction(
  id: number | null,
  values: ServiceValues,
): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  const service = parsed.data;
  return saveRecord({
    apiPath: '/admin/services',
    id,
    body: {
      name: service.name,
      appDescription: optional(service.appDescription),
      appRoute: optional(service.appRoute),
      appIcon: optional(service.appIcon),
      iconForApp: optional(service.iconForApp),
    },
    redirectTo: '/admin/services',
  });
}

export async function saveProductCategoryAction(
  id: number | null,
  values: ProductCategoryValues,
): Promise<ActionResult> {
  const parsed = productCategorySchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  return saveRecord({
    apiPath: '/admin/product-categories',
    id,
    body: { name: parsed.data.name, description: optional(parsed.data.description) },
    redirectTo: '/admin/product-categories',
  });
}

export async function saveProductAction(
  id: number | null,
  values: ProductValues,
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  const product = parsed.data;
  return saveRecord({
    apiPath: '/admin/products',
    id,
    body: {
      name: product.name,
      description: optional(product.description),
      serviceId: product.serviceId,
      categoryId: product.categoryId,
      price: product.price,
      adultLimit: product.adultLimit,
      childPrice: product.childPrice,
      childLimit: product.childLimit,
      infantPrice: product.infantPrice,
      infantLimit: product.infantLimit,
      guestPrice: Number.isNaN(product.guestPrice) ? null : product.guestPrice,
    },
    redirectTo: '/admin/products',
  });
}

export async function saveCardAction(id: number | null, values: CardValues): Promise<ActionResult> {
  const parsed = cardSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  const card = parsed.data;
  return saveRecord({
    apiPath: '/admin/cards',
    id,
    body: {
      name: card.name,
      detail: card.detail,
      bin: card.bin,
      sortOrder: Number.isNaN(card.sortOrder) ? undefined : card.sortOrder,
      isActive: card.isActive,
    },
    redirectTo: '/admin/cards',
  });
}

export async function saveMembershipTypeAction(
  id: number | null,
  values: MembershipTypeValues,
): Promise<ActionResult> {
  const parsed = membershipTypeSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  return saveRecord({
    apiPath: '/admin/membership-types',
    id,
    body: parsed.data,
    redirectTo: '/admin/membership-types',
  });
}

export async function saveFaqQuestionAction(
  id: number | null,
  values: FaqQuestionValues,
): Promise<ActionResult> {
  const parsed = faqQuestionSchema.safeParse(values);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }
  if (!isValidId(id)) {
    return actionFailure(INVALID_ID);
  }
  return saveRecord({
    apiPath: '/admin/faq-questions',
    id,
    body: parsed.data,
    redirectTo: '/admin/faq-questions',
  });
}
