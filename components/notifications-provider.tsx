"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: "appointment_reminder" | "appointment_confirmed" | "appointment_cancelled" | "system" | "ai_alert"
  is_read: boolean
  appointment_id?: string
  created_at: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notifications:", error)
      return
    }

    setNotifications(data || [])
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    }
  }

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Set up real-time subscription
    const {
      data: { user },
    } = supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const channel = supabase
          .channel("notifications")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${data.user.id}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification
              setNotifications((prev) => [newNotification, ...prev])

              // Show toast for new notifications
              toast({
                title: newNotification.title,
                description: newNotification.message,
              })
            },
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    })
  }, [supabase, toast])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
