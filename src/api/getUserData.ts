// sdk-triggerx/src/api/getUserData.ts

import { TriggerXClient } from '../client';
import { UserData } from '../types';

export const getUserData = async (client: TriggerXClient, address: string): Promise<UserData> => {
  const apiKey = client.getApiKey(); // Assuming you have a method to get the API key

  try {
    const response = await client.get<UserData>(
      `api/users/${address}`, 
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      }
    );
    return response; // Assuming the response data matches the UserData interface
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};
