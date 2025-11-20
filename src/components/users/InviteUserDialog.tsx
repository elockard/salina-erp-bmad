'use client'

/**
 * Invite User Dialog Component
 *
 * Client component that renders a dialog for inviting new users to the tenant.
 * Uses React Hook Form + Zod for validation and Server Actions for submission.
 *
 * **Features:**
 * - Email input with validation
 * - Role selector with descriptions
 * - Client-side validation (React Hook Form + Zod)
 * - Server Action integration (inviteUser)
 * - Optimistic UI updates
 *
 * @see Story 2.1: Build User Invitation System (AC#1)
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  userInviteSchema,
  type UserInvite,
  USER_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from '@/validators/user'
import { inviteUser } from '@/actions/users'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * InviteUserDialog Component
 *
 * Renders "Invite User" button that opens dialog with invitation form.
 */
export function InviteUserDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Initialize React Hook Form with Zod validation
  const form = useForm<UserInvite>({
    resolver: zodResolver(userInviteSchema),
    defaultValues: {
      email: '',
      role: undefined,
    },
  })

  /**
   * Handle form submission
   *
   * Calls inviteUser Server Action and handles response:
   * - Success: Close dialog, show success toast, refresh page
   * - Error: Show error toast, keep dialog open
   */
  async function onSubmit(data: UserInvite) {
    try {
      setIsSubmitting(true)

      // Call Server Action to invite user
      const result = await inviteUser(data)

      if (result.success) {
        // Success: Close dialog and show success message
        setOpen(false)
        form.reset()
        toast.success('Invitation sent!', {
          description: `An invitation has been sent to ${data.email}`,
        })

        // Refresh page to show new pending user in list
        router.refresh()
      } else {
        // Error: Show error message
        toast.error('Failed to send invitation', {
          description: result.message || 'Please try again',
        })
      }
    } catch (error) {
      // Unexpected error
      console.error('Failed to invite user:', error)
      toast.error('Failed to send invitation', {
        description: 'An unexpected error occurred. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new team member to your organization.
            They'll receive an email with a link to create their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    We'll send an invitation to this email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Field */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {ROLE_LABELS[role]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {ROLE_DESCRIPTIONS[role]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This role determines what the user can access and edit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
