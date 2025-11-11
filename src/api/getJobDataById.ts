// sdk-triggerx/src/api/getJobDataById.ts

import { TriggerXClient } from '../client';
import { JobDataAPI, TaskData, JobDataWithTasks } from '../types';
import { 
  ValidationError, 
  NetworkError, 
  AuthenticationError, 
  ApiError,
  createErrorResponse,
  extractHttpStatusCode,
  determineErrorCode
} from '../utils/errors';

export const getJobDataById = async (
  client: TriggerXClient,
  jobId: string,
  userAddress: string
): Promise<{ success: boolean; data?: JobDataWithTasks; error?: string; errorCode?: string; errorType?: string; details?: any }> => {
  // Validate inputs
  if (!jobId || typeof jobId !== 'string') {
    return createErrorResponse(
      new ValidationError('jobId', 'Job ID is required and must be a string'),
      'Validation error'
    );
  }
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
    // Fetch the job data using new user-based API endpoint
    const jobResponse = await client.get<JobDataAPI>(
      `/api/jobs/user/${userAddress}/${jobId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );

    // Fetch the task data (logs) using new endpoint if required (let's keep same logic)
    const taskResponse = await client.get<TaskData[]>(
      `/api/tasks/job/${jobId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );

    // Combine both responses
    const combinedResponse: JobDataWithTasks = {
      jobData: jobResponse,
      taskData: taskResponse
    };

    return { success: true, data: combinedResponse };
  } catch (error) {
    console.error('Error fetching job data and task data by ID:', error);
    
    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return createErrorResponse(
          new NetworkError('Network error while fetching job data', { originalError: error, jobId, userAddress }, httpStatusCode),
          'Network error'
        );
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        return createErrorResponse(
          new ValidationError('jobId or userAddress', 'Job not found', { originalError: error, jobId, userAddress }, 404),
          'Validation error'
        );
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return createErrorResponse(
          new AuthenticationError('Unauthorized access to job data', { originalError: error, jobId, userAddress }, 401),
          'Authentication error'
        );
      } else if (error.message.includes('API') || error.message.includes('response')) {
        return createErrorResponse(
          new ApiError('API error while fetching job data', { originalError: error, jobId, userAddress }, httpStatusCode),
          'API error'
        );
      }
    }
    
    return createErrorResponse(
      error,
      'Failed to fetch job data'
    );
  }
};
