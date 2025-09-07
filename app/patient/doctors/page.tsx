import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const SPECIALIZATIONS = [
  "All Specializations",
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "Psychiatry",
  "Gynecology",
  "Ophthalmology",
  "ENT",
  "Dentistry",
]

export default async function FindDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; specialization?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  // Build query for doctors
  let query = supabase
    .from("doctors")
    .select(`
      *,
      profiles!doctors_id_fkey(first_name, last_name)
    `)
    .eq("is_active", true)

  // Apply filters
  if (params.specialization && params.specialization !== "All Specializations") {
    query = query.eq("specialization", params.specialization)
  }

  if (params.search) {
    query = query.or(
      `profiles.first_name.ilike.%${params.search}%,profiles.last_name.ilike.%${params.search}%,specialization.ilike.%${params.search}%`,
    )
  }

  const { data: doctors } = await query.order("created_at", { ascending: false })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Find a Doctor</h1>
        <p className="text-muted-foreground">Search and book appointments with healthcare professionals</p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form method="GET" className="flex gap-4">
            <div className="flex-1">
              <Input
                name="search"
                placeholder="Search by doctor name or specialization..."
                defaultValue={params.search}
              />
            </div>
            <div className="w-64">
              <Select name="specialization" defaultValue={params.specialization || "All Specializations"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {doctors && doctors.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Dr. {doctor.profiles?.first_name} {doctor.profiles?.last_name}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {doctor.specialization}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Consultation</p>
                    <p className="font-semibold">${doctor.consultation_fee}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{doctor.years_of_experience} years</p>
                  </div>

                  {doctor.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground">About</p>
                      <p className="text-sm line-clamp-3">{doctor.bio}</p>
                    </div>
                  )}

                  {doctor.available_days && doctor.available_days.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Available Days</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doctor.available_days.slice(0, 3).map((day) => (
                          <Badge key={day} variant="outline" className="text-xs capitalize">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                        {doctor.available_days.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{doctor.available_days.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button asChild className="w-full">
                    <Link href={`/patient/book/${doctor.id}`}>Book Appointment</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No doctors found matching your criteria.</p>
            <Button asChild variant="outline" className="mt-4 bg-transparent">
              <Link href="/patient/doctors">Clear Filters</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
