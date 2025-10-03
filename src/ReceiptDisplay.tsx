import { type Extraction } from './types'
import LineItems from './LineItems'

interface ReceiptDisplayProps {
  extraction: Extraction | null
  showDetails?: boolean
}

function ReceiptDisplay({ extraction, showDetails = false }: ReceiptDisplayProps) {
  if (!extraction) return null
  return <LineItems storeInfo={extraction.storeInfo} items={extraction.itemList} total={extraction.paymentSummary.totalAmount} showDetails={showDetails} />
}

export default ReceiptDisplay