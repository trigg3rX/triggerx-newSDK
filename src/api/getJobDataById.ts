// sdk-triggerx/src/api/getJobDataById.ts

import { TriggerXClient } from '../client';
import { JobDataAPI, TaskData, JobDataWithTasks } from '../types';

export const getJobDataById = async (client: TriggerXClient, jobId: string): Promise<JobDataWithTasks> => {
  const apiKey = client.getApiKey(); // Assuming you have a method to get the API key

  try {
    // First, fetch the job data
    const jobResponse = await client.get<JobDataAPI>(
        `/api/jobs/${jobId}`, 
        {
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
        }
    );

    // Then, fetch the task data (logs) for this job
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

    return combinedResponse;
  } catch (error) {
    console.error('Error fetching job data and task data by ID:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};
