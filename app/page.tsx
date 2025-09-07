import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-svh bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MedConnect</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connecting patients with healthcare professionals through seamless appointment booking and AI-powered
            assistance.
          </p>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">For Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Find and book appointments with doctors</li>
                <li>• View your appointment history</li>
                <li>• Receive AI-powered health reminders</li>
                <li>• Get instant notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">For Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Manage your appointment schedule</li>
                <li>• Set availability and consultation fees</li>
                <li>• Track patient appointments</li>
                <li>• Receive booking notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">AI Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Smart appointment reminders</li>
                <li>• Health tips and alerts</li>
                <li>• Chatbot assistance</li>
                <li>• Personalized notifications</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
