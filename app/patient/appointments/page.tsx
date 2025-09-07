import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function PatientAppointmentsPage() {
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

  if (profile?.user_type !== "patient") {
    redirect("/doctor/dashboard")
  }

  // Get patient's appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors!appointments_doctor_id_fkey(
        specialization,
        consultation_fee,
        profiles!doctors_id_fkey(first_name, last_name)
      )
    `)
    .eq("patient_id", user.id)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })

  // Separate upcoming and past appointments
  const today = new Date().toISOString().split("T")[0]
  const upcomingAppointments = appointments?.filter((apt) => apt.appointment_date >= today) || []
  const pastAppointments = appointments?.filter((apt) => apt.appointment_date < today) || []

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

  const cancelAppointment = async (appointmentId: string) => {
    "use server"
    const supabase = await createClient()

    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointmentId)

    redirect("/patient/appointments")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">View and manage your scheduled appointments</p>
        </div>
        <Button asChild>
          <a href="/patient/doctors">Book New Appointment</a>
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">
                          Dr. {appointment.doctors?.profiles?.first_name} {appointment.doctors?.profiles?.last_name}
                        </h3>
                        <Badge variant="secondary">{appointment.doctors?.specialization}</Badge>
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(appointment.appointment_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p>
                          <strong>Time:</strong> {appointment.appointment_time}
                        </p>
                        <p>
                          <strong>Reason:</strong> {appointment.reason_for_visit}
                        </p>
                        <p>
                          <strong>Fee:</strong> ${appointment.doctors?.consultation_fee}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {appointment.status === "scheduled" && (
                        <form action={cancelAppointment.bind(null, appointment.id)}>
                          <Button variant="outline" size="sm" type="submit">
                            Cancel
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No upcoming appointments.</p>
              <Button asChild className="mt-4">
                <a href="/patient/doctors">Book Your First Appointment</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
          <div className="space-y-4">
            {pastAppointments.slice(0, 5).map((appointment) => (
              <Card key={appointment.id} className="opacity-75">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">
                          Dr. {appointment.doctors?.profiles?.first_name} {appointment.doctors?.profiles?.last_name}
                        </h3>
                        <Badge variant="secondary">{appointment.doctors?.specialization}</Badge>
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Time:</strong> {appointment.appointment_time}
                        </p>
                        <p>
                          <strong>Reason:</strong> {appointment.reason_for_visit}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
