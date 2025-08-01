// sdk-triggerx/src/api/getJobDataById.ts

import { TriggerXClient } from '../client';
import { JobDataAPI } from '../types';

export const getJobDataById = async (client: TriggerXClient, jobId: string): Promise<JobDataAPI> => {
  const apiKey = client.getApiKey(); // Assuming you have a method to get the API key

  try {
    const response = await client.get<JobDataAPI>(
        `/api/jobs/${jobId}`, 
        {
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
        }
    );
    return response; // Assuming the response data matches the JobDataAPI interface
  } catch (error) {
    console.error('Error fetching job data by ID:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};
