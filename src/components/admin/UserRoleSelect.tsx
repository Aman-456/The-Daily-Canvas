"use client"

import { useState } from "react"
import { toggleUserRole } from "@/actions/user"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Props {
  userId: string
  currentRole: "USER" | "ADMIN" | "SUBADMIN"
  disabled?: boolean
}

export function UserRoleSelect({ userId, currentRole, disabled }: Props) {
  const [loading, setLoading] = useState(false)

  const handleRoleChange = async (newRole: "USER" | "ADMIN" | "SUBADMIN") => {
    if (newRole === currentRole) return
    setLoading(true)
    try {
      await toggleUserRole(userId, newRole)
      toast.success(`Role updated to ${newRole}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || loading}>
          {currentRole}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleRoleChange("USER")}>USER</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("SUBADMIN")}>SUBADMIN</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")}>ADMIN</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
