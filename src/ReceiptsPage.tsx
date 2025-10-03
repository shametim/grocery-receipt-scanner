import { Link } from 'react-router-dom'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type Receipt } from './types'
import ReceiptDisplay from './ReceiptDisplay'
import Header from './Header'
import ItemsSection from './ItemsSection'

interface ReceiptsPageProps {
  receipts: Receipt[] | null
  fetchLoading: boolean
  user: any
  logout: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleScanClick: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  loading: boolean
}

function ReceiptsPage({ receipts, fetchLoading, user, logout, handleFileChange, handleScanClick, inputRef, loading }: ReceiptsPageProps) {
  return (
    <div className="min-h-screen p-4">
      <Header user={user} logout={logout} />
      <Input id="file" ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <Button size="lg" onClick={handleScanClick} disabled={loading} className="fixed bottom-4 right-4 rounded-none">
        {loading ? 'Scanning...' : 'Scan Your Grocery Receipt'}
      </Button>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Receipt</h2>
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
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Items</h2>
        <ItemsSection receipts={receipts} />
      </div>
    </div>
  )
}

export default ReceiptsPage