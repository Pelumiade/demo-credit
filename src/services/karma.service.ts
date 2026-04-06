import axios from 'axios';
import { env } from '../config/env';

const client = axios.create({
  baseURL: env.adjutor.baseUrl,
  headers: { Authorization: `Bearer ${env.adjutor.apiKey}` },
  timeout: 5000,
});

export const isBlacklisted = async (email: string): Promise<boolean> => {
  try {
    const { data } = await client.get(`/verification/karma/${email}`);
    return data?.data?.karma_identity !== undefined;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return false;
    }
    // Fail closed — if the Karma API is unreachable, deny onboarding
    throw new Error('Karma service unavailable');
  }
};
