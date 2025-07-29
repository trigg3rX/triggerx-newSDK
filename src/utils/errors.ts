export class TriggerXError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TriggerXError';
  }
}

export function wrapError(error: unknown): TriggerXError {
  if (error instanceof Error) {
    return new TriggerXError(error.message);
  }
  return new TriggerXError('Unknown error');
} 