import { type Extraction, type Receipt } from './types'
import ReceiptSummaryCard from './ReceiptSummaryCard'
import ReceiptDetailCard from './ReceiptDetailCard'

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

  return (
    <div className="w-full">
      {showDetails ? (
        <ReceiptDetailCard storeInfo={storeInfo} items={items} total={total} />
      ) : (
        <ReceiptSummaryCard storeInfo={storeInfo} total={total} />
      )}
    </div>
  )
}

export default ReceiptDisplay