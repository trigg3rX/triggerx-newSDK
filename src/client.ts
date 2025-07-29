import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getConfig } from './config';

export class TriggerXClient {
  private client: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    const baseConfig = getConfig();
    this.client = axios.create({
      baseURL: baseConfig.apiUrl,
      headers: { 'Authorization': `Bearer ${baseConfig.apiKey}` },
      ...config,
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }
} 