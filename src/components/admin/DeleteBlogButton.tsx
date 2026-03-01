"use client"

import { useState } from "react"
import { deleteBlog } from "@/actions/blog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

export function DeleteBlogButton({ blogId }: { blogId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog?")) return

    setLoading(true)
    try {
      await deleteBlog(blogId)
      toast.success("Blog deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete blog")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      size="icon" 
      onClick={handleDelete} 
      disabled={loading}
      className="h-8 w-8"
      title="Delete blog"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
