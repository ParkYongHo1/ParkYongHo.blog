export interface ApiErrorType extends Error {
  statusCode: number;
  isApiError: true;
}

export const createApiError = (
  message: string,
  statusCode: number = 500
): ApiErrorType => {
  const error = new Error(message) as ApiErrorType;
  error.statusCode = statusCode;
  error.isApiError = true;
  return error;
};

export const isApiError = (error: unknown): error is ApiErrorType => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isApiError" in error &&
    (error as ApiErrorType).isApiError === true
  );
};
