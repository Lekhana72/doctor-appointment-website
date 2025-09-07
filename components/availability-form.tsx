"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface AvailabilityFormProps {
  doctorId: string
}

export function AvailabilityForm({ doctorId }: AvailabilityFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState<string>("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const router = useRouter()

  const dayOptions = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dayOfWeek || !startTime || !endTime) {
      toast.error("Please fill in all fields")
      return
    }

    if (startTime >= endTime) {
      toast.error("End time must be after start time")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("doctor_availability").insert({
        doctor_id: doctorId,
        day_of_week: Number.parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
      })

      if (error) {
        console.error("Error adding availability:", error)
        toast.error("Failed to add availability. Please try again.")
        return
      }

      toast.success("Availability added successfully!")

      // Reset form
      setDayOfWeek("")
      setStartTime("")
      setEndTime("")

      // Refresh the page to show updated availability
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
        <Label htmlFor="dayOfWeek">Day of Week</Label>
        <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
          <SelectTrigger>
            <SelectValue placeholder="Select a day" />
          </SelectTrigger>
          <SelectContent>
            {dayOptions.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="startTime">Start Time</Label>
        <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="endTime">End Time</Label>
        <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Adding..." : "Add Availability"}
      </Button>
    </form>
  )
}
