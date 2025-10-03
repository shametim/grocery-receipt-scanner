import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { type Extraction } from './types'
import LineItems from './LineItems'
import sample from './sample.json'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [extraction, setExtraction] = useState<Extraction | null>(sample.extraction)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) uploadFile()
  }, [file])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }



  const uploadFile = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('user_id', 'test-user') // TODO: Replace with actual user ID from auth
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
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center mb-2">Groggy</h1>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-sm border-none shadow-none">
        <CardContent className="p-2 space-y-2">
          <Input id="file" ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="lg" onClick={handleScanClick} disabled={loading} className="rounded-none">
            {loading ? 'Scanning...' : 'Scan Your Grocery Receipt'}
          </Button>
        </CardFooter>
        </Card>
      </div>
       {extraction && <LineItems storeInfo={extraction.storeInfo} items={extraction.itemList} total={extraction.paymentSummary.totalAmount} />}
    </div>
  )
}



export default App
