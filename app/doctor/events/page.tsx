import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { EventForm } from "@/components/event-form"

export default async function DoctorEventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.user_type !== "doctor") {
    redirect("/dashboard")
  }

  // Get upcoming events (appointments) for the next 30 days
  const today = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(today.getDate() + 30)

  const { data: events } = await supabase
    .from("appointments")
    .select(`
      *,
      profiles!appointments_patient_id_fkey(first_name, last_name)
    `)
    .eq("doctor_id", user.id)
    .gte("appointment_date", today.toISOString().split("T")[0])
    .lte("appointment_date", thirtyDaysLater.toISOString().split("T")[0])
    .order("appointment_date")
    .order("appointment_time")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground">Create and manage your calendar events</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/doctor/availability">Manage Availability</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/doctor/schedule">View Schedule</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create New Event */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm doctorId={user.id} />
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events && events.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {event.profiles
                          ? `${event.profiles.first_name} ${event.profiles.last_name}`
                          : event.reason_for_visit || "Personal Event"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.appointment_date).toLocaleDateString()} at {event.appointment_time}
                      </p>
                      {event.reason_for_visit && (
                        <p className="text-xs text-muted-foreground">{event.reason_for_visit}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upcoming events.</p>
                <p className="text-sm text-muted-foreground">Create your first event using the form on the left.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
