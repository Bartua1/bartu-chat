import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../../env.js";

// In App Router, route handlers receive params directly as an argument
export async function GET(
  request: NextRequest,
  { params }: { params: { api: string } }
) {
   
  // params is already available, no need to await context
  const { api } = await params;
  const requestApis = api;
  console.log(`Fetching API: ${requestApis}`);

  if (requestApis === "openai"){
    return NextResponse.json({openai: env.OPEN_AI_URL ?? "http://localhost:1234/v1"});
  }
  else if (requestApis === "openaikey"){
    return NextResponse.json({openaikey: env.OPEN_AI_API_KEY ?? "http://localhost:1234/v1"});
  }
  else if (requestApis === "all") {
    return NextResponse.json({
      openai: env.OPEN_AI_URL ?? "http://localhost:1234/v1",
      openaikey: env.OPEN_AI_API_KEY ?? "http://localhost:1234/v1"
    });
  }
  else {
    return NextResponse.json({ error: "Invalid API" }, { status: 400 });
  }
}