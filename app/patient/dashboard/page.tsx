import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import Link from "next/link"

export default async function PatientDashboardPage() {
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

  if (profile?.role !== "patient") {
    redirect("/doctor/dashboard")
  }

  // Get upcoming appointments
  const today = new Date().toISOString().split("T")[0]
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      doctor:doctors(
        specialization,
        full_name
      )
    `)
    .eq("patient_id", user.id)
    .gte("appointment_date", today)
    .order("appointment_date")
    .order("appointment_time")
    .limit(3)

  // Get total appointments count
  const { count: totalAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", user.id)

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
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
        </div>
        <div className="flex gap-2">
          <NotificationsDropdown />
          <Button asChild variant="outline">
            <Link href="/patient/appointments">View All Appointments</Link>
          </Button>
          <Button asChild>
            <Link href="/patient/doctors">Find a Doctor</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{new Date(user.created_at).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/patient/doctors">Book New Appointment</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/patient/appointments">View My Appointments</Link>
            </Button>
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
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Dr. {appointment.doctor?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                      <p className="text-xs text-muted-foreground">{appointment.doctor?.specialization}</p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No upcoming appointments.</p>
                <Button asChild>
                  <Link href="/patient/doctors">Book Your First Appointment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
