export type ApiResponse<T> = {
  data: T;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    field?: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor: string | null;
};
