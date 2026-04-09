import axios from 'axios';
import { env } from '../config/env';

const client = axios.create({
  baseURL: env.adjutor.baseUrl,
  headers: { Authorization: `Bearer ${env.adjutor.apiKey}` },
  timeout: 5000,
});

const checkIdentity = async (identity: string): Promise<boolean> => {
  try {
    const { data } = await client.get(`/verification/karma/${encodeURIComponent(identity)}`);
    return data?.status === 'success' && data?.data?.karma_identity !== undefined;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return false;
    }
    throw new Error('Karma service unavailable');
  }
};

export const isBlacklisted = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1];

  // Check both the full email and the domain against Karma
  const [emailBlacklisted, domainBlacklisted] = await Promise.all([
    checkIdentity(email),
    checkIdentity(domain),
  ]);

  return emailBlacklisted || domainBlacklisted;
};