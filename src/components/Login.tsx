import { useEffect, useRef } from "react"

import { useAuth } from '../AuthContext'

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

export default function Login() {
  const { login } = useAuth()
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
                  const data = await res.json()
                  login(data.user)
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
  }, [login])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-12">Groggy</h1>
        <h3 className="text-3xl font-bold text-black mb-12">Grocery Receipt Scanner</h3>
        <div ref={buttonRef} className="flex justify-center" />
      </div>
    </div>
  )
}