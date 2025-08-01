import { TriggerXClient } from '../src/client';
import { getJobData } from '../src/api/getjob';

async function main() {
  // The user should provide their actual API key here
  const apiKey = 'TGRX-ece02db8-f676-4a9f-a4f8-a95f59e755d8';

  // Create the client with the API key
  const client = new TriggerXClient(apiKey);

  // Call the SDK function to get job data
  const response = await getJobData(client);

  if (response.success) {
    // Access job_data from the response
    const jobData = response.jobs; // Use optional chaining in case job_data is undefined
    console.log('Job Data:', jobData);
  } else {
    console.error('Error fetching jobs:', response.error);
  }
}

main().catch(console.error); 