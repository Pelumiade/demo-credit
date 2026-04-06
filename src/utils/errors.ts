export const createError = (message: string, statusCode: number): Error =>
    Object.assign(new Error(message), { statusCode });
  
  export const assertPositiveAmount = (amount: number): void => {
    if (amount <= 0) throw createError('Amount must be greater than zero', 400);
  };