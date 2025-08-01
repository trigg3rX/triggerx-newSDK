// sdk-triggerx/test/getJobDataById.test.ts

import { TriggerXClient } from '../src/client';
import { getJobDataById } from '../src/api/getJobDataById';

async function main() {
  // The user should provide their actual API key here
  const apiKey = 'TGRX-ece02db8-f676-4a9f-a4f8-a95f59e755d8'; // Use a mock API key

  // Create the client with the API key
  const client = new TriggerXClient(apiKey);

  // Define a job ID for testing
  const jobId = 'YOUR_JOB_ID'; // Replace with a valid job ID for testing

  try {
    // Call the SDK function to get job data
    const response = await getJobDataById(client, jobId);

    // Log the response
    console.log('Job Data:', response);
  } catch (error) {
    console.error('Error fetching job data:', error);
  }
}

main().catch(console.error);