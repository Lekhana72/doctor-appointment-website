"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

const SPECIALIZATIONS = [
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
  "Other",
]

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    specialization: "",
    license_number: "",
    years_of_experience: 0,
    bio: "",
    consultation_fee: 0,
    available_days: [] as string[],
    start_time: "09:00",
    end_time: "17:00",
    is_active: true,
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
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

      if (profileData?.user_type !== "doctor") {
        router.push("/dashboard")
        return
      }

      setProfile(profileData)

      // Get doctor profile
      const { data: doctorData } = await supabase.from("doctors").select("*").eq("id", user.id).single()

      if (doctorData) {
        setDoctorProfile(doctorData)
        setFormData({
          specialization: doctorData.specialization || "",
          license_number: doctorData.license_number || "",
          years_of_experience: doctorData.years_of_experience || 0,
          bio: doctorData.bio || "",
          consultation_fee: doctorData.consultation_fee || 0,
          available_days: doctorData.available_days || [],
          start_time: doctorData.available_hours?.start || "09:00",
          end_time: doctorData.available_hours?.end || "17:00",
          is_active: doctorData.is_active ?? true,
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    const supabase = createClient()
    setIsSaving(true)
    setError(null)

    try {
      const doctorData = {
        id: profile.id,
        specialization: formData.specialization,
        license_number: formData.license_number,
        years_of_experience: formData.years_of_experience,
        bio: formData.bio,
        consultation_fee: formData.consultation_fee,
        available_days: formData.available_days,
        available_hours: {
          start: formData.start_time,
          end: formData.end_time,
        },
        is_active: formData.is_active,
      }

      if (doctorProfile) {
        // Update existing profile
        const { error } = await supabase.from("doctors").update(doctorData).eq("id", profile.id)
        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase.from("doctors").insert(doctorData)
        if (error) throw error
      }

      router.push("/doctor/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        available_days: [...prev.available_days, day],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        available_days: prev.available_days.filter((d) => d !== day),
      }))
    }
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Doctor Profile</h1>
        <p className="text-muted-foreground">Complete your profile to start accepting appointments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Select
                value={formData.specialization}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, specialization: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
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

            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={formData.license_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, license_number: e.target.value }))}
                placeholder="Enter license number"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.years_of_experience}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, years_of_experience: Number.parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Consultation Fee ($)</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.consultation_fee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, consultation_fee: Number.parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell patients about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.available_days.includes(day)}
                    onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                  />
                  <Label htmlFor={day} className="capitalize">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked as boolean }))}
            />
            <Label htmlFor="active">Accept new appointments</Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/doctor/dashboard")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
