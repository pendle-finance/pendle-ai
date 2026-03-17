---
name: common-errors
description: 'Common Errors -- Consolidated Reference'
---

# Common Errors -- Consolidated Reference

> Errors across all Pendle MCP tools, organized by category.
> All errors return structured JSON with `isError: true` and a `PendleErrorCode`.

---

## Structured Error Codes

Every tool error is classified with a code, retryable flag, and suggested action:

| Code | Retryable | Meaning |
|---|:---:|---|
| `RATE_LIMITED` | Yes | 429 — minute or weekly CU limit hit |
| `API_UNAVAILABLE` | Yes | 500/502/503/504 — transient server issue |
| `TIMEOUT` | Yes | Request timed out or connection reset |
| `TOKEN_NOT_FOUND` | No | Token not in Pendle's asset registry |
| `MARKET_NOT_FOUND` | No | Market address not recognised |
| `NO_ROUTE_FOUND` | No | Convert API can't find a swap path |
| `MARKET_EXPIRED` | No | Operation not allowed post-maturity |
| `INVALID_PARAMS` | No | Missing or malformed parameters (400) |
| `PRICE_IMPACT_HIGH` | No | Price impact above safe threshold |
| `SLIPPAGE_ESTIMATION_FAILED` | No | Can't auto-determine slippage |
| `UNKNOWN` | No | Catch-all for unclassified errors |

Error response format:
```json
{
  "isError": true,
  "content": [{ "type": "text", "text": "{\"ok\":false,\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"...\",\"retryable\":true,\"action\":\"...\"}}" }]
}
```

---

## API & Network Errors (all tools)

| Error | Code | Fix |
|---|---|---|
| `429 Too Many Requests` | `RATE_LIMITED` | Server auto-retries once after minute reset. If weekly budget exhausted, upgrade plan. |
| `400 Bad Request` | `INVALID_PARAMS` | Check token addresses, amounts, and chain ID |
| `404 not found` | `MARKET_NOT_FOUND` | Confirm chainId matches market chain |
| `500/502/503/504` | `API_UNAVAILABLE` | Retry in a few seconds |
| Timeout / ECONNRESET | `TIMEOUT` | Retry |

---

## Convert API Errors (buy/sell/LP/mint/redeem/pendle_swap tools)

| Error | Code | Fix |
|---|---|---|
| `No route found` / `Cannot convert` | `NO_ROUTE_FOUND` | Check token addresses; try a different pair or amount |
| `Price impact too high` | `PRICE_IMPACT_HIGH` | Split into smaller trades |
| `routes is empty` | `NO_ROUTE_FOUND` | Zero liquidity or unsupported pair |
| `Cannot buy YT post-maturity` | `MARKET_EXPIRED` | YT is worthless after expiry. Use redeem-py instead. |
| `Cannot sell YT post-maturity` | `MARKET_EXPIRED` | YT is $0 after expiry. Use redeem-py with PT. |
| `Cannot add liquidity post-maturity` | `MARKET_EXPIRED` | Pool no longer generates fees. Use remove_liquidity to exit. |
| `mint-py not available post-maturity` | `MARKET_EXPIRED` | Cannot split into worthless YT. |
| Tx reverts on-chain | N/A | Approve input token to `transaction.to` before submitting |
| `slippage exceeded` | N/A | Increase slippage or re-quote |

---

## Slippage & Price Errors

| Error | Code | Fix |
|---|---|---|
| `Token not found in asset metadata` | `SLIPPAGE_ESTIMATION_FAILED` | Token not in Pendle registry. Provide explicit `slippage` parameter. |
| `No USD price available` | `SLIPPAGE_ESTIMATION_FAILED` | Price not available. Provide explicit `slippage` parameter. |
| `Slippage must be between 0 and 0.5` | `INVALID_PARAMS` | Slippage is a decimal (0.01 = 1%), max 0.5 (50%) |

---

## Market Data Errors

| Error | Code | Fix |
|---|---|---|
| Empty results from `get_markets` | N/A | Wrong chainId or no active markets. Filter by expiry date. |
| `Market not found on chain` | `MARKET_NOT_FOUND` | Verify market address and chainId. Use `get_markets` to discover valid markets. |

---

## Limit Order Errors

| Error | Code | Fix |
|---|---|---|
| `User balance is not enough` | `INVALID_PARAMS` | Fund the wallet or reduce order size |
| `impliedApy out of range` | `INVALID_PARAMS` | Check current impliedApy from `get_market` |
| `expiry must be in the future` | `INVALID_PARAMS` | Recalculate: `Math.floor(Date.now()/1000) + seconds` |
| Invalid signature (400) | `INVALID_PARAMS` | Verify EIP-712 hash signing method |

---

## Portfolio Errors

| Error | Code | Fix |
|---|---|---|
| Empty positions | N/A | No Pendle positions, or new tx not indexed yet (wait ~1 min) |

---

## Chain Reference

| chainId | Network |
|---|---|
| 1 | Ethereum mainnet |
| 42161 | Arbitrum |
| 56 | BNB Chain |
| 10 | Optimism |
| 8453 | Base |
| 5000 | Mantle |
| 146 | Sonic |
