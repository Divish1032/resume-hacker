import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags");
    
    if (!response.ok) {
        // If Ollama is not running or other error
        return NextResponse.json({ models: [] }, { status: 200 }); 
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return NextResponse.json({ models: [] }, { status: 200 }); // Return empty list instead of error to avoid breaking UI
  }
}
