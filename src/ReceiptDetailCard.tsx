import { type Item, type StoreInfo } from './types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

interface ReceiptDetailCardProps {
  storeInfo: StoreInfo
  items: Item[]
  total: number
}

function ReceiptDetailCard({ storeInfo, items, total }: ReceiptDetailCardProps) {
  const date = new Date(storeInfo.transactionDate)
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{storeInfo.storeName}</CardTitle>
        <CardDescription>
          <strong>{formattedDate}</strong><br />
          {storeInfo.address}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>${item.itemPrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <span className="font-semibold">Total:</span>
          <span className="font-semibold">${total.toFixed(2)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ReceiptDetailCard