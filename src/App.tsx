import { useState, useRef, useEffect } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { type Extraction } from './types'
import ReceiptDisplay from './ReceiptDisplay'
import sample from './sample.json'
import Login from './components/Login'
import { useAuth } from './AuthContext'

function App() {
  const { loggedIn, user, authLoading, logout } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [extraction, setExtraction] = useState<Extraction | null>(sample.extraction)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) uploadFile()
  }, [file])

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!loggedIn) {
    return <Login />
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadFile = async () => {
    if (!file || !user) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('user_id', user.id)
      const response = await fetch('/api/extract', { method: 'POST', body: formData })
      const data = await response.json()
      setExtraction(data.extraction)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScanClick = () => {
    inputRef.current?.click()
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/receipts" />} />
      <Route path="/receipts" element={
        <div className="min-h-screen p-4">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h1 className="text-3xl font-bold">Groggy</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2">
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
                <DropdownMenuItem onClick={logout}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Input id="file" ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button size="lg" onClick={handleScanClick} disabled={loading} className="fixed bottom-4 right-4 rounded-none">
            {loading ? 'Scanning...' : 'Scan Your Grocery Receipt'}
          </Button>
          <div className="flex justify-center">
            <ReceiptDisplay extraction={extraction} />
          </div>
        </div>
      } />
      <Route path="/receipts/:id" element={
        <div className="min-h-screen p-4">
          <div className="mb-4">
            <Link to="/receipts">
              <Button variant="outline">Back to Receipts</Button>
            </Link>
          </div>
          <div className="flex justify-center">
            <ReceiptDisplay extraction={extraction} showDetails={true} />
          </div>
        </div>
      } />
    </Routes>
  )
}



export default App
