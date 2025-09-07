"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface EventFormProps {
  doctorId: string
}

export function EventForm({ doctorId }: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [duration, setDuration] = useState("30")
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventDate || !eventTime || !title) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check if the date is in the future
    const selectedDate = new Date(`${eventDate}T${eventTime}`)
    if (selectedDate <= new Date()) {
      toast.error("Event date must be in the future")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Create a personal event (appointment without a patient)
      const { error } = await supabase.from("appointments").insert({
        doctor_id: doctorId,
        patient_id: doctorId, // Use doctor's ID as patient for personal events
        appointment_date: eventDate,
        appointment_time: eventTime,
        duration_minutes: Number.parseInt(duration),
        reason_for_visit: title,
        notes: notes,
        status: "confirmed", // Personal events are automatically confirmed
      })

      if (error) {
        console.error("Error creating event:", error)
        if (error.code === "23505") {
          toast.error("You already have an event at this time")
        } else {
          toast.error("Failed to create event. Please try again.")
        }
        return
      }

      toast.success("Event created successfully!")

      // Reset form
      setEventDate("")
      setEventTime("")
      setDuration("30")
      setTitle("")
      setNotes("")

      // Refresh the page to show updated events
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Personal appointment, Break, Meeting"
          required
        />
      </div>

      <div>
        <Label htmlFor="eventDate">Date *</Label>
        <Input
          id="eventDate"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          required
        />
      </div>

      <div>
        <Label htmlFor="eventTime">Time *</Label>
        <Input id="eventTime" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="15"
          max="480"
          step="15"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for this event..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Event"}
      </Button>
    </form>
  )
}
