import { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

interface ParseResponse {
  markdown: string;
}

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const VALID_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

type GoogleClaims = {
  sub: string;
  email?: string;
  name?: string;
};

const DEFAULT_SESSION_DAYS = 30;
const SECONDS_IN_DAY = 24 * 60 * 60;

type MyEnv = {
  GOOGLE_CLIENT_ID: string;
  JWT_SECRET: string;
  DB: D1Database;
  API_KEY: string;
};

const app = new Hono<{ Bindings: MyEnv }>();

async function verifyGoogleIdToken(c: { env: MyEnv }, idToken: string): Promise<GoogleClaims> {
  const GOOGLE_CLIENT_ID = c.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }
  if (!idToken) {
    throw new Error("Missing Google ID token");
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: GOOGLE_CLIENT_ID,
  });

  validatePayload(payload);

  const sub = payload.sub as string;
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const name = typeof payload.name === "string" ? payload.name : undefined;

  return { sub, email, name };
}

function validatePayload(payload: any): asserts payload is any & { sub: string } {
  const iss = payload.iss;
  if (typeof iss !== "string" || !VALID_ISSUERS.has(iss)) {
    throw new Error("Invalid Google issuer");
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Invalid Google subject");
  }
}

async function upsertUser(c: { env: MyEnv }, { id, name, email }: { id: string; name?: string | null; email?: string | null }) {
  if (!id) throw new Error("User id is required");
  return await c.env.DB.prepare(
    `INSERT INTO users (id, name, email) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email`
  ).bind(id, name ?? null, email ?? null).run();
}

async function createSession(c: { env: MyEnv }, userId: string, days = DEFAULT_SESSION_DAYS): Promise<{ sid: string; expires: number }> {
  if (!userId) throw new Error("User id is required for session");
  const sid = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const expires = now + Math.max(1, Math.floor(days * SECONDS_IN_DAY));
  await c.env.DB.prepare(
    `INSERT INTO sessions (sid, user_id, expires_at, last_seen) VALUES (?, ?, ?, ?)`
  ).bind(sid, userId, expires, now).run();
  return { sid, expires };
}

function setSessionCookie(sid: string, expires: number): string {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = Math.max(0, expires - now);
  return `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function parseCookies(header: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!header) return map;
  const parts = header.split(/;\s*/);
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) map.set(key, decodeURIComponent(value));
  }
  return map;
}

async function getSession(c: { env: MyEnv; req: { header: (name: string) => string | undefined } }): Promise<{ sid: string; userId: string; name: string | null; email: string | null; newExp: number } | null> {
  const cookies = parseCookies(c.req.header("cookie"));
  const sid = cookies.get("sid");
  if (!sid) return null;

  const { results } = await c.env.DB.prepare(
    `SELECT sessions.sid as sid, sessions.user_id as user_id, sessions.expires_at as expires_at, users.name as name, users.email as email
     FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.sid = ?`
  ).bind(sid).all();
  if (results.length === 0) return null;

  const record = results[0] as any;
  const now = Math.floor(Date.now() / 1000);
  if (record.expires_at <= now) {
    await c.env.DB.prepare(`DELETE FROM sessions WHERE sid = ?`).bind(sid).run();
    return null;
  }

  const newExp = now + DEFAULT_SESSION_DAYS * SECONDS_IN_DAY;
  await c.env.DB.prepare(
    `UPDATE sessions SET expires_at = ?, last_seen = ? WHERE sid = ?`
  ).bind(newExp, now, sid).run();

  return { sid, userId: record.user_id, name: record.name ?? null, email: record.email ?? null, newExp };
}

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/receipts/:userId", async (c) => {
  const userId = c.req.param("userId");
  const { results } = await c.env.DB.prepare("SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return c.json(results);
});

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
    const userId = formData.get("user_id") as string;
    if (!file) {
      console.error("No file provided");
      return c.json({ error: "No file provided" }, 400);
    }
    if (!userId) {
      console.error("No user_id provided");
      return c.json({ error: "No user_id provided" }, 400);
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

   // Store in database
   const { meta } = await c.env.DB.prepare(
     "INSERT INTO receipts (store_name, address, transaction_date, total_amount, items, user_id) VALUES (?, ?, ?, ?, ?, ?)"
   ).bind(
     extractJson.storeInfo?.storeName || '',
     extractJson.storeInfo?.address || '',
     extractJson.storeInfo?.transactionDate || '',
     extractJson.paymentSummary?.totalAmount || 0,
     JSON.stringify(extractJson.itemList || []),
     userId
   ).run();

   console.log("Receipt stored in database");
    return c.json({ ...extractJson, receiptId: meta.last_row_id });
   } catch (error) {
     console.error("Error in extract endpoint:", error);
     return c.json({ error: "Internal server error" }, 500);
   }
 });

app.get("/auth/config", (c) => {
  return c.json({ googleClientId: c.env.GOOGLE_CLIENT_ID ?? null });
});

app.post("/auth/google", async (c) => {
  try {
    console.log("Auth request received");
    const { id_token } = await c.req.json() as { id_token: string };
    console.log("ID token received, verifying...");
    const claims = await verifyGoogleIdToken(c, id_token);
    console.log("Claims verified:", claims);
    console.log("Upserting user...");
    await upsertUser(c, { id: claims.sub, name: claims.name, email: claims.email });
    console.log("User upserted, creating session...");
    const { sid, expires } = await createSession(c, claims.sub);
    console.log("Session created, sid:", sid);
    const cookie = setSessionCookie(sid, expires);
    return c.json({ user: { id: claims.sub, name: claims.name, email: claims.email } }, {
      headers: { "Set-Cookie": cookie }
    });
  } catch (err) {
    console.error("Auth failed:", err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : undefined);
    return c.json({ error: "Authentication failed" }, 401);
  }
});

app.get("/me", async (c) => {
  const session = await getSession(c);
  if (!session) {
    return c.json({ user: null }, 401);
  }
  return c.json({ user: { id: session.userId, name: session.name, email: session.email } });
});

app.post("/logout", async (c) => {
  const session = await getSession(c);
  if (session) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE sid = ?').bind(session.sid).run();
  }
  return c.json({ success: true }, {
    headers: { "Set-Cookie": "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" }
  });
});

export default app;
