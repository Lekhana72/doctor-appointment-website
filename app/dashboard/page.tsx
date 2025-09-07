import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  // Redirect based on user type
  if (profile?.user_type === "doctor") {
    redirect("/doctor/dashboard")
  } else if (profile?.user_type === "patient") {
    redirect("/patient/dashboard")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to MedConnect</h1>
          <p className="text-muted-foreground">
            Hello, {profile?.first_name} {profile?.last_name}
          </p>
        </div>
        <form action={handleSignOut}>
          <Button variant="outline" type="submit">
            Sign Out
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">{profile?.user_type || "Patient"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{new Date(data.user.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>

      {profile?.user_type === "patient" && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Find a Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Search for doctors and book your appointments.</p>
              <Button asChild>
                <a href="/patient/doctors">Browse Doctors</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
