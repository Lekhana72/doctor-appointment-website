"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
]

export default function BookAppointmentPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const [doctorId, setDoctorId] = useState<string>("")
  const [doctor, setDoctor] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [reasonForVisit, setReasonForVisit] = useState("")
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params
      setDoctorId(resolvedParams.doctorId)
    }
    initializeParams()
  }, [params])

  useEffect(() => {
    if (doctorId) {
      loadDoctorAndProfile()
    }
  }, [doctorId])

  useEffect(() => {
    if (selectedDate && doctorId) {
      loadBookedSlots()
    }
  }, [selectedDate, doctorId])

  const loadDoctorAndProfile = async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData?.user_type !== "patient") {
        router.push("/doctor/dashboard")
        return
      }

      setProfile(profileData)

      // Get doctor details
      const { data: doctorData } = await supabase
        .from("doctors")
        .select(`
          *,
          profiles!doctors_id_fkey(first_name, last_name, full_name)
        `)
        .eq("id", doctorId)
        .eq("is_active", true)
        .single()

      if (!doctorData) {
        setError("Doctor not found or not available")
        return
      }

      setDoctor(doctorData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load doctor information")
    } finally {
      setIsLoading(false)
    }
  }

  const loadBookedSlots = async () => {
    if (!selectedDate || !doctorId) return

    const supabase = createClient()
    const dateString = selectedDate.toISOString().split("T")[0]

    const { data: appointments } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", dateString)
      .in("status", ["scheduled", "confirmed"])

    setBookedSlots(appointments?.map((apt) => apt.appointment_time) || [])
  }

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !reasonForVisit.trim()) {
      setError("Please fill in all required fields")
      return
    }

    const supabase = createClient()
    setIsBooking(true)
    setError(null)

    try {
      const appointmentData = {
        patient_id: profile.id,
        doctor_id: doctorId,
        appointment_date: selectedDate.toISOString().split("T")[0],
        appointment_time: selectedTime,
        reason: reasonForVisit,
        status: "scheduled",
      }

      const { data: newAppointment, error: bookingError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single()

      if (bookingError) {
        if (bookingError.code === "23505") {
          setError("This time slot is no longer available. Please select another time.")
        } else {
          throw bookingError
        }
        return
      }

      try {
        // Send notification to doctor
        await supabase.from("notifications").insert({
          user_id: doctorId,
          title: "New Appointment Booked",
          message: `${profile.full_name} has booked an appointment for ${selectedDate.toLocaleDateString()} at ${selectedTime}. Reason: ${reasonForVisit}`,
          type: "appointment_confirmed",
          appointment_id: newAppointment.id,
        })

        // Send confirmation notification to patient
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Appointment Booked Successfully",
          message: `Your appointment with Dr. ${doctor?.full_name} has been scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
          type: "appointment_confirmed",
          appointment_id: newAppointment.id,
        })
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError)
        // Don't fail the booking if notifications fail
      }

      router.push("/patient/appointments")
    } catch (error: any) {
      setError(error.message || "Failed to book appointment")
    } finally {
      setIsBooking(false)
    }
  }

  const isDateAvailable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) return false

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    return doctor?.available_days?.includes(dayName) || false
  }

  const getAvailableTimeSlots = () => {
    if (!doctor?.available_hours) return TIME_SLOTS

    const startTime = doctor.available_hours.start || "09:00"
    const endTime = doctor.available_hours.end || "17:00"

    return TIME_SLOTS.filter((time) => {
      return time >= startTime && time <= endTime && !bookedSlots.includes(time)
    })
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  if (error && !doctor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button asChild variant="outline" className="mt-4 bg-transparent">
              <a href="/patient/doctors">Back to Doctors</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Book Appointment</h1>
        <p className="text-muted-foreground">Schedule your visit with the doctor</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Doctor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">
                Dr. {doctor?.profiles?.first_name} {doctor?.profiles?.last_name}
              </h3>
              <Badge variant="secondary" className="mt-1">
                {doctor?.specialization}
              </Badge>
            </div>

            <div className="grid gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium">{doctor?.years_of_experience} years</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Consultation Fee</p>
                <p className="font-medium">${doctor?.consultation_fee}</p>
              </div>

              {doctor?.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">About</p>
                  <p className="text-sm">{doctor.bio}</p>
                </div>
              )}

              {doctor?.available_days && (
                <div>
                  <p className="text-sm text-muted-foreground">Available Days</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doctor.available_days.map((day) => (
                      <Badge key={day} variant="outline" className="capitalize">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border"
              />
            </div>

            {selectedDate && (
              <div>
                <Label>Select Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Textarea
                id="reason"
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                placeholder="Please describe your symptoms or reason for the visit..."
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || !reasonForVisit.trim() || isBooking}
              className="w-full"
            >
              {isBooking ? "Booking..." : "Book Appointment"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
