import { type Extraction, type Receipt } from './types'
import LineItems from './LineItems'

interface ReceiptDisplayProps {
  extraction?: Extraction | null
  receipt?: Receipt | null
  showDetails?: boolean
}

function ReceiptDisplay({ extraction, receipt, showDetails = false }: ReceiptDisplayProps) {
  if (!extraction && !receipt) return null

  let storeInfo, items, total

  if (receipt) {
    // Convert receipt to extraction format
    storeInfo = {
      storeName: receipt.store_name,
      address: receipt.address,
      cashierName: '',
      transactionDate: receipt.transaction_date,
      transactionTime: ''
    }
    items = receipt.items
    total = receipt.total_amount
  } else if (extraction) {
    storeInfo = extraction.storeInfo
    items = extraction.itemList
    total = extraction.paymentSummary.totalAmount
  } else {
    return null
  }

  return <LineItems storeInfo={storeInfo} items={items} total={total} showDetails={showDetails} />
}

export default ReceiptDisplay