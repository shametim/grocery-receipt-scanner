import { useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')

  const fetchHello = async () => {
    try {
      const response = await fetch('/api/')
      const data = await response.json()
      setMessage(JSON.stringify(data))
    } catch (error) {
      setMessage('Error fetching data')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-white drop-shadow-lg mb-8">Hello World</h1>
        <button
          onClick={fetchHello}
          className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
        >
          Test API
        </button>
        {message && <p className="mt-4 text-white">{message}</p>}
      </div>
    </div>
  )
}

export default App
