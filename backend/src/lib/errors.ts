import { NextResponse } from "next/dist/server/web/spec-extension/response";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const handleError = (error: any) => {
  if (error instanceof AppError) {
    return NextResponse.json(
      { message: error.message }, 
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  );
};
