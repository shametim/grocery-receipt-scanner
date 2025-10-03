import { useState, useRef, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { type Receipt } from './types'
import Login from './components/Login'
import { useAuth } from './AuthContext'
import ReceiptsPage from './ReceiptsPage'
import ReceiptDetailPage from './ReceiptDetailPage'

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
      <Route path="/receipts" element={<ReceiptsPage receipts={receipts} fetchLoading={fetchLoading} user={user} logout={logout} handleFileChange={handleFileChange} handleScanClick={handleScanClick} inputRef={inputRef} loading={loading} />} />
      <Route path="/receipts/:id" element={<ReceiptDetailPage fetchReceipt={fetchReceipt} selectedReceipt={selectedReceipt} fetchLoading={fetchLoading} user={user} logout={logout} />} />
    </Routes>
  )
}



export default App
