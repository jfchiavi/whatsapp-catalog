import { afterAll, describe, it, expect } from 'vitest';
import { POST as loginPOST } from '../src/app/api/auth/login/route';
import { POST as refreshPOST } from '../src/app/api/auth/refresh/route';
import { prisma } from '../src/lib/prisma';

const validCredentials = { email: 'admin@demo.com', password: '123456' };

describe('Auth API routes', () => {
  let refreshToken: string;

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: 'user-demo-admin',
      },
    });
    await prisma.$disconnect();
  });

  it('logs in an existing user and returns access + refresh tokens', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCredentials),
    });

    const response = await loginPOST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        userResponse: expect.objectContaining({
          email: validCredentials.email,
          id: expect.any(String),
          role: expect.any(String),
        }),
      })
    );

    refreshToken = data.refreshToken;
  });

  it('refreshes a valid refresh token successfully', async () => {
    expect(refreshToken).toBeTruthy();

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const response = await refreshPOST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
  });

  it('rejects login with invalid password', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validCredentials.email, password: 'wrongpassword' }),
    });

    const response = await loginPOST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toEqual(expect.objectContaining({ message: 'Invalid credentials' }));
  });
});
