// types.ts
export interface UserModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number | null;
  isActive: string;
  userApiId: number | null;
  owner: string;
  apiName?: string;
  apiUrl?: string;
  isFavorite?: boolean; // Optional field for UI purposes
  createdAt?: number | string | Date;
  tags?: string[];
}

export interface UserAPI {
  id: number;
  name: string;
  provider: string;
  apiUrl: string;
  isActive: string;
}

export interface AvailableModel {
  id: string;
  object: string;
  created: number;
  provider: string;
  owned_by: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

export interface ModelToImport {
  name: string;
  displayName: string;
  inputPrice: number;
  outputPrice: number;
  maxTokens: number | null;
  isActive: string;
  selected: boolean;
}
