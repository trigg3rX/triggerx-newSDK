export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
} 