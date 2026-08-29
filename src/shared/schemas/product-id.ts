import { z } from "zod";

export const PRODUCT_ID_PATTERN = /^product_[a-z0-9]+(?:_[a-z0-9]+)*$/;

export const productIdSchema = z.string().regex(PRODUCT_ID_PATTERN);

