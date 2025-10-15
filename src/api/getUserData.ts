// sdk-triggerx/src/api/getUserData.ts

import { TriggerXClient } from '../client';
import { UserData } from '../types';
import { 
  ValidationError, 
  NetworkError, 
  AuthenticationError, 
  ApiError,
  createErrorResponse,
  extractHttpStatusCode,
  determineErrorCode
} from '../utils/errors';

export const getUserData = async (client: TriggerXClient, address: string): Promise<{ success: boolean; data?: UserData; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
  // Validate inputs
  if (!address || typeof address !== 'string') {
    return createErrorResponse(
      new ValidationError('address', 'User address is required and must be a string'),
      'Validation error'
    );
  }

  const apiKey = client.getApiKey();
  if (!apiKey) {
    return createErrorResponse(
      new AuthenticationError('API key is required but not provided'),
      'Authentication error'
    );
  }

  try {
    const response = await client.get<UserData>(
      `api/users/${address}`, 
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return createErrorResponse(
          new NetworkError('Network error while fetching user data', { originalError: error, address }, httpStatusCode),
          'Network error'
        );
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        return createErrorResponse(
          new ValidationError('address', 'User not found', { originalError: error, address }, 404),
          'Validation error'
        );
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return createErrorResponse(
          new AuthenticationError('Unauthorized access to user data', { originalError: error, address }, 401),
          'Authentication error'
        );
      } else if (error.message.includes('API') || error.message.includes('response')) {
        return createErrorResponse(
          new ApiError('API error while fetching user data', { originalError: error, address }, httpStatusCode),
          'API error'
        );
      }
    }
    
    return createErrorResponse(
      error,
      'Failed to fetch user data'
    );
  }
};
