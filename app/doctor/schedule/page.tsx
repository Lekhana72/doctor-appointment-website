import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DoctorSchedulePage() {
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

  // Get appointments for the next 30 days
  const today = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(today.getDate() + 30)

  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      profiles!appointments_patient_id_fkey(first_name, last_name, phone)
    `)
    .eq("doctor_id", user.id)
    .gte("appointment_date", today.toISOString().split("T")[0])
    .lte("appointment_date", thirtyDaysLater.toISOString().split("T")[0])
    .order("appointment_date")
    .order("appointment_time")

  // Group appointments by date
  const appointmentsByDate =
    appointments?.reduce((acc: any, appointment) => {
      const date = appointment.appointment_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(appointment)
      return acc
    }, {}) || {}

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

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    "use server"
    const supabase = await createClient()

    await supabase.from("appointments").update({ status }).eq("id", appointmentId)

    redirect("/doctor/schedule")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Manage your appointments and availability</p>
        </div>
        <Button asChild>
          <Link href="/doctor/availability">Set Availability</Link>
        </Button>
      </div>

      {Object.keys(appointmentsByDate).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No appointments scheduled.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(appointmentsByDate).map(([date, dayAppointments]: [string, any]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{appointment.appointment_time}</div>
                          <div>
                            <p className="font-medium">
                              {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{appointment.reason_for_visit}</p>
                            {appointment.profiles?.phone && (
                              <p className="text-sm text-muted-foreground">{appointment.profiles.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                        {appointment.status === "scheduled" && (
                          <form action={updateAppointmentStatus.bind(null, appointment.id, "confirmed")}>
                            <Button size="sm" type="submit">
                              Confirm
                            </Button>
                          </form>
                        )}
                        {appointment.status === "confirmed" && (
                          <form action={updateAppointmentStatus.bind(null, appointment.id, "completed")}>
                            <Button size="sm" variant="outline" type="submit">
                              Complete
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
