import { type Receipt } from './types'

interface ItemsSectionProps {
  receipts: Receipt[] | null
}

function ItemsSection({ receipts }: ItemsSectionProps) {
  if (!receipts || receipts.length === 0) {
    return <div>No items yet.</div>
  }

  const allItems = receipts.flatMap(receipt =>
    receipt.items.map(item => ({
      ...item,
      receiptId: receipt.id,
      receiptDate: receipt.transaction_date,
      storeName: receipt.store_name
    }))
  )

  return (
    <div className="space-y-4">
      {allItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center p-2 border rounded">
          <span>{item.itemName}</span>
          <span>${item.itemPrice.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export default ItemsSection