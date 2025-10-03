import { type Extraction } from './types'
import LineItems from './LineItems'

interface ReceiptDisplayProps {
  extraction: Extraction | null
}

function ReceiptDisplay({ extraction }: ReceiptDisplayProps) {
  if (!extraction) return null
  return <LineItems storeInfo={extraction.storeInfo} items={extraction.itemList} total={extraction.paymentSummary.totalAmount} />
}

export default ReceiptDisplay