export interface ModelProvider {
  name: string;
  icon: string;
}

export interface ModelTags {
  name: string;
  label: string;
  icon: string;
}

export const modelProviders: ModelProvider[] = [
  { name: 'openai', icon: '/openai.png' },
  { name: 'gemini', icon: '/gemini.png' },
  { name: 'anthropic', icon: '/anthropic.png' },
  { name: 'llama', icon: '/llama.png' },
  // Add more models here
];