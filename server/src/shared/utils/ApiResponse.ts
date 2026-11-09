export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T | undefined;
  public readonly meta: PaginationMeta | undefined;

  private constructor(
    success: boolean,
    message: string,
    data?: T,
    meta?: PaginationMeta,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  public static success<T>(
    message: string,
    data?: T,
    meta?: PaginationMeta,
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data, meta);
  }

  public static created<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data);
  }
  
  public static failed(message: string): ApiResponse {
    return new ApiResponse(false, message);
  }
}
