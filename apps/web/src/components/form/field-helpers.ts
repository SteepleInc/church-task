import type { ValidationError } from "@tanstack/react-form";
import { Array, pipe } from "effect";

const getErrorMessage = (error: ValidationError) => {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
};

const extractErrorMessages = (errors: Array<ValidationError>) =>
  pipe(
    errors,
    Array.map(getErrorMessage),
    Array.filter((message): message is string => message !== undefined),
    Array.join(", "),
  );

export const getFieldErrors = (errors: Array<ValidationError>): { processedError?: string } =>
  pipe(
    errors,
    Array.match({
      onEmpty: () => ({}),
      onNonEmpty: () => ({
        processedError: extractErrorMessages(errors),
      }),
    }),
  );
