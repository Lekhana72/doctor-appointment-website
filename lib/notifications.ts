import { createServerClient } from "@/lib/supabase/server"

export async function createNotification({
  userId,
  title,
  message,
  type,
  appointmentId,
}: {
  userId: string
  title: string
  message: string
  type: "appointment_reminder" | "appointment_confirmed" | "appointment_cancelled" | "system" | "ai_alert"
  appointmentId?: string
}) {
  const supabase = createServerClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    appointment_id: appointmentId,
  })

  if (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function sendAppointmentNotifications(
  appointmentId: string,
  type: "confirmed" | "cancelled" | "reminder",
) {
  const supabase = createServerClient()

  // Get appointment details
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select(`
      *,
      doctor:doctors(full_name, specialization),
      patient:profiles!appointments_patient_id_fkey(full_name)
    `)
    .eq("id", appointmentId)
    .single()

  if (appointmentError || !appointment) {
    console.error("Error fetching appointment:", appointmentError)
    return
  }

  const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString()
  const appointmentTime = appointment.appointment_time

  let title: string
  let message: string
  let notificationType: "appointment_confirmed" | "appointment_cancelled" | "appointment_reminder"

  switch (type) {
    case "confirmed":
      title = "Appointment Confirmed"
      message = `Your appointment with Dr. ${appointment.doctor.full_name} on ${appointmentDate} at ${appointmentTime} has been confirmed.`
      notificationType = "appointment_confirmed"
      break
    case "cancelled":
      title = "Appointment Cancelled"
      message = `Your appointment with Dr. ${appointment.doctor.full_name} on ${appointmentDate} at ${appointmentTime} has been cancelled.`
      notificationType = "appointment_cancelled"
      break
    case "reminder":
      title = "Appointment Reminder"
      message = `Reminder: You have an appointment with Dr. ${appointment.doctor.full_name} tomorrow at ${appointmentTime}.`
      notificationType = "appointment_reminder"
      break
  }

  // Send notification to patient
  await createNotification({
    userId: appointment.patient_id,
    title,
    message,
    type: notificationType,
    appointmentId,
  })

  // Send notification to doctor
  const doctorMessage = message.replace("Your appointment", `Appointment with ${appointment.patient.full_name}`)
  await createNotification({
    userId: appointment.doctor_id,
    title,
    message: doctorMessage,
    type: notificationType,
    appointmentId,
  })
}
