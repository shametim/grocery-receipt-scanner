import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LoginProps {
  onLogin: () => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
          renderButton(element: HTMLElement, options: Record<string, unknown>): void;
          prompt(): void;
        };
      };
    };
  }
}

export default function Login({ onLogin }: LoginProps) {
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) return
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)
    }

    const initializeGoogleSignIn = async () => {
      try {
        const response = await fetch("/auth/config")
        const config = await response.json()
        if (!config.googleClientId) {
          console.error("Google client ID not configured")
          return
        }

        const googleId = window.google?.accounts?.id
        if (googleId && buttonRef.current) {
          googleId.initialize({
            client_id: config.googleClientId,
            callback: async (response: { credential: string }) => {
              try {
                const res = await fetch("/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id_token: response.credential }),
                })
                if (res.ok) {
                  onLogin()
                } else {
                  console.error("Sign-in failed")
                }
              } catch (err) {
                console.error("Sign-in error", err)
              }
            },
          })
          googleId.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: 260,
          })
        }
      } catch (err) {
        console.error("Failed to load Google config", err)
      }
    }

    loadGoogleScript()
  }, [onLogin])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div ref={buttonRef} className="flex justify-center" />
        </CardContent>
      </Card>
    </div>
  )
}