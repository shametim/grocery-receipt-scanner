import { Hono } from "hono";

interface ParseResponse {
  markdown: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Markdown Document Field Extraction Schema",
  "description": "Schema for extracting high-value tabular and form-like information from a markdown document, focusing on structured fields such as IDs, names, addresses, account info, dates, and summary tables.",
  "type": "object",
  "properties": {
    "storeInfo": {
      "title": "Store Information",
      "description": "Key details about the store and transaction.",
      "type": "object",
      "properties": {
        "storeName": {
          "title": "Store Name",
          "description": "The name of the store.",
          "type": "string"
        },
        "address": {
          "title": "Store Address",
          "description": "The address of the store.",
          "type": "string"
        },
        "cashierName": {
          "title": "Cashier Name",
          "description": "The name of the cashier who processed the transaction.",
          "type": "string"
        },
        "transactionDate": {
          "title": "Transaction Date",
          "description": "The date of the transaction.",
          "type": "string"
        },
        "transactionTime": {
          "title": "Transaction Time",
          "description": "The time of the transaction.",
          "type": "string"
        }
      },
      "required": [
        "storeName",
        "address",
        "cashierName",
        "transactionDate",
        "transactionTime"
      ]
    },
    "paymentSummary": {
      "title": "Payment Summary",
      "description": "Summary of payment and transaction details.",
      "type": "object",
      "properties": {
        "paymentMethod": {
          "title": "Payment Method",
          "description": "The method of payment used.",
          "type": "string"
        },
        "totalAmount": {
          "title": "Total Amount",
          "description": "The total amount paid for the transaction.",
          "type": "number"
        },
        "changeGiven": {
          "title": "Change Given",
          "description": "The amount of change given to the customer.",
          "type": "number"
        },
        "itemsSold": {
          "title": "Items Sold",
          "description": "The total number of items sold in the transaction.",
          "type": "number"
        },
        "referenceNumber": {
          "title": "Reference Number",
          "description": "The reference number for the transaction.",
          "type": "string"
        }
      },
      "required": [
        "paymentMethod",
        "totalAmount",
        "changeGiven",
        "itemsSold",
        "referenceNumber"
      ]
    },
    "itemList": {
      "title": "Purchased Items",
      "description": "An exhaustive list of all the items purchased in the transaction. Can be up to 100.",
      "type": "array",
      "items": {
        "title": "Item",
        "description": "Details of a purchased item.",
        "type": "object",
        "properties": {
          "itemName": {
            "title": "Item Name",
            "description": "The name or description of the item.",
            "type": "string"
          },
          "itemPrice": {
            "title": "Item Price",
            "description": "The price of the item.",
            "type": "number"
          },
          "itemType": {
            "title": "Item Type",
            "description": "The type or category of the item (e.g., food, taxable).",
            "type": "string"
          },
          "weight": {
            "title": "Item Weight",
            "description": "The weight of the item, if applicable.",
            "type": "number"
          },
          "unitPrice": {
            "title": "Unit Price",
            "description": "The price per unit weight, if applicable.",
            "type": "number"
          }
        },
        "required": [
          "itemName",
          "itemPrice",
          "itemType",
          "weight",
          "unitPrice"
        ]
      }
    },
    "savingsSummary": {
      "title": "Savings and Coupons Summary",
      "description": "Summary of savings, coupons, and fuel points earned.",
      "type": "object",
      "properties": {
        "totalSavings": {
          "title": "Total Savings",
          "description": "The total amount saved during the transaction.",
          "type": "number"
        },
        "totalCoupons": {
          "title": "Total Coupons",
          "description": "The total value of coupons applied.",
          "type": "number"
        },
        "annualCardSavings": {
          "title": "Annual Card Savings",
          "description": "The total annual savings from the store card.",
          "type": "number"
        },
        "fuelPointsEarned": {
          "title": "Fuel Points Earned",
          "description": "The number of fuel points earned in this transaction.",
          "type": "number"
        },
        "totalFuelPoints": {
          "title": "Total Fuel Points",
          "description": "The total number of fuel points for the current month.",
          "type": "number"
        }
      },
      "required": [
        "totalSavings",
        "totalCoupons",
        "annualCardSavings",
        "fuelPointsEarned",
        "totalFuelPoints"
      ]
    },
    "accountInfo": {
      "title": "Account Information",
      "description": "Key account identifiers and customer information.",
      "type": "object",
      "properties": {
        "customerId": {
          "title": "Customer ID",
          "description": "The customer or loyalty card identifier.",
          "type": "string"
        },
        "cardType": {
          "title": "Card Type",
          "description": "The type of card used for payment.",
          "type": "string"
        },
        "cardLastDigits": {
          "title": "Card Last Digits",
          "description": "The last digits of the card used for payment.",
          "type": "string"
        },
        "aid": {
          "title": "AID",
          "description": "Application Identifier for the card transaction.",
          "type": "string"
        },
        "tc": {
          "title": "TC",
          "description": "Transaction Certificate for the card transaction.",
          "type": "string"
        }
      },
      "required": [
        "customerId",
        "cardType",
        "cardLastDigits",
        "aid",
        "tc"
      ]
    }
  },
  "required": [
    "storeInfo",
    "paymentSummary",
    "itemList",
    "savingsSummary",
    "accountInfo"
  ]
};

app.post("/api/extract", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("document") as File;
    if (!file) {
      console.error("No file provided");
      return c.json({ error: "No file provided" }, 400);
    }
    console.log("File received:", file.name);

    const apiKey = c.env.API_KEY;
    if (!apiKey) {
      console.error("API key not set");
      return c.json({ error: "API key not set" }, 500);
    }

  const headers = { "Authorization": `Basic ${apiKey}` };

  // Parse the document
  const parseFormData = new FormData();
  parseFormData.append("document", file);
  parseFormData.append("model", "dpt-2-latest");
  console.log("Sending parse request for file:", file.name);

  const parseResponse = await fetch("https://api.va.landing.ai/v1/ade/parse", {
    method: "POST",
    headers,
    body: parseFormData,
  });

  if (!parseResponse.ok) {
    console.error("Parse failed with status:", parseResponse.status);
    return c.json({ error: "Parse failed" }, 500);
  }

  const parseJson = await parseResponse.json() as ParseResponse;
  const markdownContent = parseJson.markdown;
  console.log("Parse response received");

  // Extract fields
  const extractFormData = new FormData();
  extractFormData.append("markdown", new Blob([markdownContent], { type: "text/plain" }));
  extractFormData.append("schema", JSON.stringify(schema));
  console.log("Sending extract request");

  const extractResponse = await fetch("https://api.va.landing.ai/v1/ade/extract", {
    method: "POST",
    headers,
    body: extractFormData,
  });

  if (!extractResponse.ok) {
    console.error("Extract failed with status:", extractResponse.status);
    return c.json({ error: "Extract failed" }, 500);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractJson = await extractResponse.json() as any;
  console.log("Extract response received");
  return c.json(extractJson);
  } catch (error) {
    console.error("Error in extract endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
