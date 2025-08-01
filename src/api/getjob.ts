import { TriggerXClient } from '../client';
import { JobResponseUser, JobResponseAPI } from '../types';

/**
 * Fetch job data for a given API key by calling the backend endpoint.
 * @param client TriggerXClient instance
 * @returns JobResponse containing job data or error
 */
export async function getJobData(client: TriggerXClient): Promise<JobResponseUser> {
  try {

    const apiKey = client.getApiKey(); // Assuming you have a method to get the API key
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
    return { success: false, error: (error as Error).message,};
  }
} 