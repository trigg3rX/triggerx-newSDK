import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getConfig } from './config';

export class TriggerXClient {
  private client: AxiosInstance;
  private apiKey: string; // Store the API key

  constructor(apiKey: string, config?: AxiosRequestConfig) {
    this.apiKey = apiKey; // Initialize the apiKey
    // const baseConfig = getConfig();
    this.client = axios.create({
      baseURL: 'https://data.triggerx.network',  //'http://localhost:9002', //'https://data.triggerx.network',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }, // Set the API key here
      timeout: 30000, // 30 second timeout
      ...config,
    });
  }

  // Method to get the API key
  getApiKey(): string {
    return this.apiKey;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // New PUT method
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }
} 