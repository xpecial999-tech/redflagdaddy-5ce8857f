type PublicDataError = {
  code?: string | null;
};

export const PUBLIC_DATA_FAILURE_MESSAGE = "This request could not be processed. Please try again.";

export function throwPublicDataError(
  error: PublicDataError,
  operation: string,
  publicMessage = PUBLIC_DATA_FAILURE_MESSAGE,
): never {
  console.error(`[public-data] ${operation} failed`, { code: error.code ?? "unknown" });
  throw new Error(publicMessage);
}
