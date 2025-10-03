import { useState } from 'react'
import { Button } from "@/components/ui/button"

function App() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0])
  }

  const uploadFile = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('document', file)
    await fetch('/api/extract', { method: 'POST', body: formData })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex min-h-svh flex-col items-center justify-center">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <Button onClick={uploadFile}>Upload Your Receipt</Button>
      </div>
    </div>
  )
}

export default App
