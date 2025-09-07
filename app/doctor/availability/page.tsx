import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AvailabilityForm } from "@/components/availability-form"

export default async function DoctorAvailabilityPage() {
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

  // Get doctor availability
  const { data: availability } = await supabase
    .from("doctor_availability")
    .select("*")
    .eq("doctor_id", user.id)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time")

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Availability</h1>
          <p className="text-muted-foreground">Set your available hours for patient appointments</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/doctor/schedule">Back to Schedule</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Current Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {availability && availability.length > 0 ? (
              <div className="space-y-3">
                {availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{dayNames[slot.day_of_week]}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No availability set yet.</p>
                <p className="text-sm text-muted-foreground">
                  Add your available hours to start accepting appointments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Add Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityForm doctorId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
