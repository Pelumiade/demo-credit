import { loginUser, registerUser } from '../../src/services/auth.service';
import { UserModel } from '../../src/models/user.model';
import { WalletModel } from '../../src/models/wallet.model';
import * as karmaService from '../../src/services/karma.service';
import db from '../../src/config/db';

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async () => '$2a$10$hashed'),
    compare: jest.fn(async () => true),
  },
}));

jest.mock('../../src/models/user.model');
jest.mock('../../src/models/wallet.model');
jest.mock('../../src/services/karma.service');
jest.mock('../../src/config/db', () => {
  const trx = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };
  const mockDb = jest.fn(() => ({}) as any);
  (mockDb as any).transaction = jest.fn((cb: (trx: any) => Promise<any>) => cb(trx));
  return { __esModule: true, default: mockDb };
});

const mockPayload = { name: 'Ada Obi', email: 'ada@test.com', phone: '08012345678', password: 'password123' };
const mockUser = { id: 'user-uuid', name: 'Ada Obi', email: 'ada@test.com', phone: '08012345678' };
const mockUserWithHash = { ...mockUser, password_hash: '$2a$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };

describe('AuthService.registerUser', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('success', () => {
    it('creates a user and returns a faux token', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
      (karmaService.isBlacklisted as jest.Mock).mockResolvedValue(false);
      (UserModel.create as jest.Mock).mockResolvedValue(undefined);
      (WalletModel.create as jest.Mock).mockResolvedValue(undefined);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await registerUser(mockPayload);

      expect(result.user.email).toBe(mockPayload.email);
      expect(result.token).toMatch(/^faux-token-/);
      expect((result.user as { password_hash?: string }).password_hash).toBeUndefined();
      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password_hash: expect.stringMatching(/^\$2[aby]\$/),
        }),
        expect.anything()
      );
    });

    it('calls karma check before writing to the database', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
      (karmaService.isBlacklisted as jest.Mock).mockResolvedValue(false);
      (UserModel.create as jest.Mock).mockResolvedValue(undefined);
      (WalletModel.create as jest.Mock).mockResolvedValue(undefined);
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await registerUser(mockPayload);

      const karmaCallOrder = (karmaService.isBlacklisted as jest.Mock).mock.invocationCallOrder[0];
      const createCallOrder = (UserModel.create as jest.Mock).mock.invocationCallOrder[0];
      expect(karmaCallOrder).toBeLessThan(createCallOrder);
    });
  });

  describe('failure', () => {
    it('throws 409 if email is already registered', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(registerUser(mockPayload)).rejects.toMatchObject({
        message: 'Email already registered',
        statusCode: 409,
      });
    });

    it('throws 403 if user is on the Karma blacklist', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
      (karmaService.isBlacklisted as jest.Mock).mockResolvedValue(true);

      await expect(registerUser(mockPayload)).rejects.toMatchObject({
        message: 'Account creation denied',
        statusCode: 403,
      });

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it('throws if the Karma service is unavailable', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
      (karmaService.isBlacklisted as jest.Mock).mockRejectedValue(
        new Error('Karma service unavailable')
      );

      await expect(registerUser(mockPayload)).rejects.toThrow('Karma service unavailable');
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });
});

describe('AuthService.loginUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns user + token when credentials are valid', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUserWithHash);

    const result = await loginUser({ email: mockUser.email, password: 'password123' });

    expect(result.token).toBe(`faux-token-${mockUser.id}`);
    expect(result.user.email).toBe(mockUser.email);
    expect((result.user as { password_hash?: string }).password_hash).toBeUndefined();
  });

  it('throws 401 when user is not found', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);
    await expect(loginUser({ email: 'missing@test.com', password: 'password123' })).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when password_hash is missing', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    await expect(loginUser({ email: mockUser.email, password: 'password123' })).rejects.toMatchObject({ statusCode: 401 });
  });
});
