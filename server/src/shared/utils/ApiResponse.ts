import type { Response } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export class ApiResponse{
  private static send<T>(
    res: Response,
    statusCode: number,
    success: boolean,
    message: string,
    data: T | null = null,
    meta: PaginationMeta | null = null,
  ): void {
    res.status(statusCode).json({
      success,
      message,
      data,
      meta,
    });
  }

  public static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = HttpStatus.OK,
  ): void {
    this.send(res, statusCode, true, message, data ?? null);
  }

  public static created<T>(
    res: Response,
    message: string,
    data: T,
  ): void {
    this.send(res, HttpStatus.CREATED, true, message, data);
  }
  
  public static failed(
    res: Response,
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ): void {
    this.send(res, statusCode, false, message);
  }

  public static paginated<T>(
    res: Response,
    message: string,
    data: T,
    meta: PaginationMeta,
  ): void {
    this.send(res, HttpStatus.OK, true, message, data, meta);
  }
}
