import { z } from "zod";
import { isValidObjectId } from "mongoose";

/** Zod string schema that rejects anything that isn't a valid Mongo ObjectId,
 *  so malformed IDs 400 at the validation layer instead of throwing a CastError. */
export const objectIdString = z.string().refine(isValidObjectId, { message: "Invalid id" });
