import { NextResponse } from 'next/server';

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Wrap API handler with error handling
 */
export function apiHandler<T>(
  handler: () => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler()
    .then((data) => {
      return NextResponse.json({
        success: true,
        data,
      });
    })
    .catch((error: any) => {
      console.error('API Error:', error);
      
      const statusCode = error.status || 500;
      const message = error.message || 'Internal server error';
      
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: statusCode }
      );
    });
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}
