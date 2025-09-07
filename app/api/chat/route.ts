import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get user context from Supabase
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let systemPrompt = `You are a helpful medical assistant for a doctor appointment booking platform. 
  You can help users with:
  - Finding doctors by specialization
  - Booking appointments
  - Understanding medical procedures
  - General health information
  - Platform navigation
  
  Always be professional, empathetic, and remind users that you cannot provide medical diagnosis or replace professional medical advice.`

  if (user) {
    // Get user profile to provide personalized assistance
    const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()

    if (profile?.role === "doctor") {
      systemPrompt += `\n\nThe user is a doctor. You can also help them with:
      - Managing their schedule and availability
      - Understanding appointment management features
      - Patient communication best practices`
    } else {
      systemPrompt += `\n\nThe user is a patient. Focus on helping them find doctors and book appointments.`
    }
  }

  const result = await generateText({
    model: groq("llama-3.1-70b-versatile"),
    system: systemPrompt,
    messages,
  })

  return new Response(JSON.stringify({ message: result.text }), {
    headers: { "Content-Type": "application/json" },
  })
}
