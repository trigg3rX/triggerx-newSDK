import { TriggerXClient } from '../client';
import { JobResponseUser, JobResponseAPI } from '../types';
import { 
  NetworkError, 
  AuthenticationError, 
  ApiError,
  createErrorResponse,
  extractHttpStatusCode,
  determineErrorCode,
  ValidationError
} from '../utils/errors';

/**
 * Fetch job data for a given API key by calling the backend endpoint.
 * @param client TriggerXClient instance
 * @returns JobResponse containing job data or error
 */
export async function getJobData(client: TriggerXClient): Promise<JobResponseUser> {
  const apiKey = client.getApiKey();
  if (!apiKey) {
    return createErrorResponse(
      new AuthenticationError('API key is required but not provided'),
      'Authentication error'
    );
  }

  try {
    const data = await client.get<JobResponseUser>(
      '/api/jobs/by-apikey',
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );
    return { success: true, jobs: data.jobs };
  } catch (error) {
    console.error('Error fetching job data:', error);
    
    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return createErrorResponse(
          new NetworkError('Network error while fetching job data', { originalError: error }, httpStatusCode),
          'Network error'
        );
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return createErrorResponse(
          new AuthenticationError('Unauthorized access to job data', { originalError: error }, 401),
          'Authentication error'
        );
      } else if (error.message.includes('API') || error.message.includes('response')) {
        return createErrorResponse(
          new ApiError('API error while fetching job data', { originalError: error }, httpStatusCode),
          'API error'
        );
      }
    }
    
    return createErrorResponse(
      error,
      'Failed to fetch job data'
    );
  }
} 

/**
 * Fetch all jobs for a given user address from the backend endpoint.
 * @param client TriggerXClient instance
 * @param userAddress string (the user's address)
 * @returns JobResponseUser containing user's jobs or error
 */
export async function getJobsByUserAddress(client: TriggerXClient, userAddress: string): Promise<JobResponseUser> {
  if (!userAddress || typeof userAddress !== 'string') {
    return createErrorResponse(
      new ValidationError('userAddress', 'User address is required and must be a string'),
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
    const data = await client.get<JobResponseUser>(
      `/api/jobs/user/${userAddress}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );
    return { success: true, jobs: data.jobs };
  } catch (error) {
    console.error('Error fetching jobs by user address:', error);

    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);

    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return createErrorResponse(
          new NetworkError('Network error while fetching jobs for user', { originalError: error, userAddress }, httpStatusCode),
          'Network error'
        );
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return createErrorResponse(
          new AuthenticationError('Unauthorized access to user jobs', { originalError: error, userAddress }, 401),
          'Authentication error'
        );
      } else if (error.message.includes('API') || error.message.includes('response')) {
        return createErrorResponse(
          new ApiError('API error while fetching jobs for user', { originalError: error, userAddress }, httpStatusCode),
          'API error'
        );
      }
    }

    return createErrorResponse(
      error,
      'Failed to fetch jobs for user'
    );
  }
} 