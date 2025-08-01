// sdk-triggerx/test/deleteJob.test.ts

import { TriggerXClient } from '../src/client';
import { deleteJob } from '../src/api/deleteJob';

async function main() {
  // The user should provide their actual API key here
  const apiKey = 'TGRX-ece02db8-f676-4a9f-a4f8-a95f59e755d8';
  
  // Create the client with the API key
  const client = new TriggerXClient(apiKey);
  
  // Specify the job ID to delete
  const jobId = 'YOUR_JOB_ID'; // Replace with an actual job ID for testing

  try {
    // Call the SDK function to delete the job
    await deleteJob(client, jobId);
    console.log(`Job with ID ${jobId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting job:', error);
  }
}

main().catch(console.error);
