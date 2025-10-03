import { useState, useRef, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, Link, useParams } from 'react-router-dom'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { type Receipt } from './types'
import ReceiptDisplay from './ReceiptDisplay'
import Login from './components/Login'
import { useAuth } from './AuthContext'

interface ReceiptDetailPageProps {
  fetchReceipt: (id: string) => void
  selectedReceipt: Receipt | null
  fetchLoading: boolean
}

function ReceiptDetailPage({ fetchReceipt, selectedReceipt, fetchLoading }: ReceiptDetailPageProps) {
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      fetchReceipt(id)
    }
  }, [id, fetchReceipt])

  return (
    <div className="min-h-screen p-4">
      <div className="mb-4">
        <Link to="/receipts">
          <Button variant="outline">Back to Receipts</Button>
        </Link>
      </div>
      <div className="flex justify-center">
        {fetchLoading ? (
          <div>Loading receipt...</div>
        ) : selectedReceipt ? (
          <ReceiptDisplay receipt={selectedReceipt} showDetails={true} />
        ) : (
          <div>Receipt not found</div>
        )}
      </div>
    </div>
  )
}

function App() {
  const { loggedIn, user, authLoading, logout } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [receipts, setReceipts] = useState<Receipt[] | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) uploadFile()
  }, [file])

  useEffect(() => {
    if (user?.id) {
      fetchReceipts()
    }
  }, [user?.id])



  const fetchReceipts = async () => {
    if (!user?.id) return
    setFetchLoading(true)
    try {
      const response = await fetch(`/api/receipts/${user.id}`)
      if (!response.ok) throw new Error('Failed to fetch receipts')
      const data = await response.json()
      // Parse items JSON strings
      const parsedReceipts = data.map((receipt: any) => ({
        ...receipt,
        items: JSON.parse(receipt.items)
      }))
      setReceipts(parsedReceipts)
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchReceipt = useCallback(async (id: string) => {
    if (!user?.id) return
    setFetchLoading(true)
    try {
      const response = await fetch(`/api/receipts/${user.id}/${id}`)
      if (!response.ok) throw new Error('Failed to fetch receipt')
      const data = await response.json()
      setSelectedReceipt(data)
    } catch (error) {
      console.error('Failed to fetch receipt:', error)
    } finally {
      setFetchLoading(false)
    }
  }, [user?.id])

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
      if (!response.ok) throw new Error('Upload failed')
      // Refresh receipts after successful upload
      await fetchReceipts()
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
          <div className="space-y-6">
            {fetchLoading ? (
              <div className="text-center">Loading receipts...</div>
            ) : receipts && receipts.length > 0 ? (
              receipts.map((receipt) => (
                <Link key={receipt.id} to={`/receipts/${receipt.id}`}>
                  <ReceiptDisplay receipt={receipt} />
                </Link>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                No receipts yet. Scan your first grocery receipt!
              </div>
            )}
          </div>
        </div>
      } />
      <Route path="/receipts/:id" element={<ReceiptDetailPage fetchReceipt={fetchReceipt} selectedReceipt={selectedReceipt} fetchLoading={fetchLoading} />} />
    </Routes>
  )
}



export default App
