 import { type Item, type StoreInfo } from './types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Link } from 'react-router-dom'

interface LineItemsProps {
  storeInfo: StoreInfo
  items: Item[]
  total: number
  showDetails?: boolean
}

function LineItems({ storeInfo, items, total, showDetails = false }: LineItemsProps) {
  const date = new Date(storeInfo.transactionDate)
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const shortDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const cardContent = (
    <Card className={`w-full ${!showDetails ? "py-0" : ""}`}>
      <CardHeader>
        {showDetails ? (
          <>
            <CardTitle>{storeInfo.storeName}</CardTitle>
            <CardDescription>
              <strong>{formattedDate}</strong><br />
              {storeInfo.address}
            </CardDescription>
          </>
        ) : (
          <CardDescription className="flex justify-between items-center">
            <span className="font-semibold">{storeInfo.storeName}</span>
            <span><strong>{shortDate}</strong></span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </CardDescription>
        )}
      </CardHeader>
      {showDetails && (
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
      )}
      {showDetails && (
        <CardFooter>
          <div className="flex justify-between w-full">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )

  const card = showDetails ? cardContent : <Link to="/receipts/1">{cardContent}</Link>

  return (
    <div className="w-full">
      {card}
    </div>
  )
}

export default LineItems