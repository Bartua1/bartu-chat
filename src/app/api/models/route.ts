import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function GET(request: NextRequest) {
  try {
    // Fetch the OpenAI base URL from your environment or configuration
    const openAIUrl = process.env.OPEN_AI_URL;

    // Initialize OpenAI client with proper server-side credentials
    const client = new OpenAI({
      baseURL: openAIUrl,
      apiKey: process.env.OPEN_AI_API_KEY ?? "dummy", // Use proper API key from environment variables
    });

    // Fetch models
    const response = await client.models.list();

    // Return the models data
    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
