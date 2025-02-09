import { cn, customFetch } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useNavigate } from "react-router"
import { authRequestSchema, authResponseSchema } from "@/schema/schema"
import { useToast } from "@/hooks/use-toast"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const url = mode === "login" ? "/api/login" : "/api/register"

    try {
      const payload = {
        email,
        password,
      }

      const requestValidation = authRequestSchema.safeParse(payload)
      if (!requestValidation.success) return

      const response = await customFetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
        })
        return
      }

      const responseValidation = authResponseSchema.safeParse(data)
      if (!responseValidation.success) {
        toast({
          variant: "destructive",
          title: "Uh oh! Validation failed.",
        })
        return
      }

      localStorage.setItem("ACCESS_TOKEN", data.token)

      navigate("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Login to your account" : "Signup Account"}
        </h1>
        {mode === "login" && (
          <p className="text-balance text-sm text-muted-foreground">
            Enter your email below to login to your account
          </p>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="johndoe@mail.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                Forgot your password?
              </a>
            )}
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="text-center text-sm">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="underline underline-offset-4"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="underline underline-offset-4"
            >
              Log In
            </button>
          </>
        )}
      </div>
    </form>
  )
}
