// sdk-triggerx/test/getUserData.test.ts

import { TriggerXClient } from '../src/client';
import { getUserData } from '../src/api/getUserData';

async function main() {
  // The user should provide their actual API key here
  const apiKey = 'TGRX-ece02db8-f676-4a9f-a4f8-a95f59e755d8';
  
  // Create the client with the API key
  const client = new TriggerXClient(apiKey);
  
  // Specify the user address to fetch data for
  const userAddress = 'YOUR_USER_ADDRESS'; // Replace with an actual user address for testing

  try {
    // Call the SDK function to get user data
    const userData = await getUserData(client, userAddress);
    console.log('User Data:', userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

main().catch(console.error);
