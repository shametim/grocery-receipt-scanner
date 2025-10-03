import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { type Receipt } from './types'
import ReceiptDisplay from './ReceiptDisplay'
import Header from './Header'

interface ReceiptDetailPageProps {
  fetchReceipt: (id: string) => void
  selectedReceipt: Receipt | null
  fetchLoading: boolean
  user: any
  logout: () => void
}

function ReceiptDetailPage({ fetchReceipt, selectedReceipt, fetchLoading, user, logout }: ReceiptDetailPageProps) {
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      fetchReceipt(id)
    }
  }, [id, fetchReceipt])

  return (
    <div className="min-h-screen p-4">
      <Header user={user} logout={logout} />
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

export default ReceiptDetailPage