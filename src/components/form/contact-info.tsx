"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Mail, Phone, MapPin } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success("Message sent successfully!")
      form.reset()
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-semibold text-white mb-8">Get in Touch</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Contact Form */}
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 bg-gray-900/50 p-6 rounded-2xl border border-gray-700 shadow-md"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        {...field}
                        className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        type="email"
                        {...field}
                        className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What is this regarding?"
                        {...field}
                        className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about your inquiry..."
                        className="min-h-[120px] border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Right: Contact Info */}
        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-md border border-gray-700 space-y-6">
          <h3 className="text-xl font-semibold mb-2">Contact Information</h3>
          <div className="flex items-start space-x-4">
            <Phone className="text-purple-400" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-gray-400">+91 7877804889</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Mail className="text-purple-400" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-gray-400">support@cricstock11.com</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <MapPin className="text-purple-400" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-gray-400"> Vaishali nagar, Jaipur 302021</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
