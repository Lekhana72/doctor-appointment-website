import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, title, message, type, appointmentId } = await request.json()

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        appointment_id: appointmentId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
