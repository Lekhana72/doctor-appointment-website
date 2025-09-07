import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import Link from "next/link"

export default async function DoctorDashboardPage() {
  const supabase = createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "doctor") {
    redirect("/dashboard")
  }

  // Get doctor profile
  const { data: doctorProfile } = await supabase.from("doctors").select("*").eq("id", user.id).single()

  // Get today's appointments
  const today = new Date().toISOString().split("T")[0]
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(full_name, phone)
    `)
    .eq("doctor_id", user.id)
    .eq("appointment_date", today)
    .order("appointment_time")

  // Get upcoming appointments (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(full_name)
    `)
    .eq("doctor_id", user.id)
    .gte("appointment_date", today)
    .lte("appointment_date", nextWeek.toISOString().split("T")[0])
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. {profile?.full_name}</p>
        </div>
        <div className="flex gap-2">
          <NotificationsDropdown />
          <Button asChild variant="outline">
            <Link href="/doctor/profile">Edit Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/doctor/events">Create Event</Link>
          </Button>
          <Button asChild>
            <Link href="/doctor/schedule">Manage Schedule</Link>
          </Button>
        </div>
      </div>

      {/* Profile Status */}
      {!doctorProfile && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">Please complete your doctor profile to start accepting appointments.</p>
            <Button asChild>
              <Link href="/doctor/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={doctorProfile ? "default" : "secondary"}>{doctorProfile ? "Complete" : "Incomplete"}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={doctorProfile?.is_available ? "default" : "secondary"}>
              {doctorProfile?.is_available ? "Available" : "Unavailable"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{appointment.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.appointment_time} • {appointment.reason}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No appointments scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{appointment.patient?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
