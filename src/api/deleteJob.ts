// sdk-triggerx/src/api/deleteJob.ts

import { TriggerXClient } from '../client';

export const deleteJob = async (client: TriggerXClient, jobId: string): Promise<void> => {
  const apiKey = client.getApiKey(); // Assuming you have a method to get the API key

  try {
    await client.put<void>(
      `api/jobs/delete/${jobId}`, {}, 
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};
