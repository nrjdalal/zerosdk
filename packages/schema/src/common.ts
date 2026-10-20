import * as z from "zod"

/** Unique identifier; 8 characters from a-z, A-Z and 0-9, e.g. aB3dE9fG */
export const Id = z.nanoid({ length: 8 }).regex(/^[A-Za-z0-9]+$/)
