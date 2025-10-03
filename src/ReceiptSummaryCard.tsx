import { type StoreInfo } from './types'
import { Card, CardHeader, CardDescription } from "@/components/ui/card"

interface ReceiptSummaryCardProps {
  storeInfo: StoreInfo
  total: number
}

function ReceiptSummaryCard({ storeInfo, total }: ReceiptSummaryCardProps) {
  const date = new Date(storeInfo.transactionDate)
  const shortDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardDescription className="flex justify-between items-center">
          <span className="font-semibold">{storeInfo.storeName}</span>
          <span><strong>{shortDate}</strong></span>
          <span className="font-semibold">${total.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export default ReceiptSummaryCard