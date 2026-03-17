---
name: token-concepts
description: 'Pendle Token Concepts -- Reference'
---

# Pendle Token Concepts -- Reference

> Core protocol concepts applicable across all Pendle skills.

---

## The Four Token Types

| Token | Symbol Pattern | What It Is | Value Behavior |
|---|---|---|---|
| **PT** -- Principal Token | `PT-XYZ-DDMMMYYYY` | Discounted claim on underlying at maturity | Rises toward $1 as expiry approaches |
| **YT** -- Yield Token | `YT-XYZ-DDMMMYYYY` | Right to receive all yield until maturity | Time-decays to $0 at expiry |
| **SY** -- Standardised Yield | `SY-XYZ` | ERC-20 wrapper around yield-bearing asset | Tracks underlying 1:1 with accrued yield |
| **LP** | `PLP-XYZ-DDMMMYYYY` | Pool share; receives PENDLE emissions + fees | Earns from three sources |

---

## Critical: LP Token = Market Address

In Pendle, there is **no separate LP token contract**. The market contract itself is the LP token:

```
market contract address === LP token address
```

---

## PT -- Principal Token

PT represents your claim on the principal at maturity, minus the yield:

```
PT price ~ 1 / (1 + impliedApy)^(daysToExpiry/365)
```

**At expiry**: PT redeems 1:1 for underlying -- no slippage, no price impact.

---

## YT -- Yield Token

YT gives you leveraged exposure to the underlying yield:

```
YT leverage ~ ptPrice / ytPrice
```

Example: PT = $0.93, YT = $0.07 -> leverage ~ 13x

- YT is **profitable** when: underlying APY > implied APY
- YT price decays to $0 at maturity -- time is critical

---

## SY -- Standardised Yield

SY is an internal Pendle wrapper that normalizes yield-bearing tokens (stETH, aUSDC, etc.) into a common interface. Users rarely interact with SY directly.

---

## LP Positions

LP positions earn from three sources simultaneously:

| Source | Driver | Typical Range |
|---|---|---|
| **PENDLE emissions** | Gauge voting weight | 3--15% APY |
| **Swap fees** | Trading volume | 0.1--2% APY |
| **PT convergence** | PT rises to $1 at maturity | Amplified in final weeks |

Available via `get_market`:
- `pendleApy` -- PENDLE emissions
- `swapFeeApy` -- trading fees
- `aggregatedApy` -- total (use this for display)

---

## Implied APY Interpretation

| Condition | Interpretation | Opportunity |
|---|---|---|
| `impliedApy > underlyingApy` | Market expects yield to fall | PT is undervalued -- lock in fixed |
| `impliedApy < underlyingApy` | Market expects yield to hold/rise | YT is attractive |
| `impliedApy ~ underlyingApy` | Fair value | LP is the default choice |

---

## sPENDLE (replaces vePENDLE)

sPENDLE is the staked version of PENDLE (1:1 ratio). Holders are eligible for:
- Revenue sharing from protocol fees
- Governance rights
- Boosted LP rewards

The old vePENDLE endpoints are deprecated.

---

## Token Lifecycle

```
Before maturity:          After maturity:
PT -> $0.93               PT -> $1.00 (redeem 1:1)
YT -> $0.07               YT -> $0.00 (worthless)
LP -> active              LP -> only redeemable PT + SY remain
```

---

## Maturity Rules — What's Available When

| Operation | Before Maturity | After Maturity |
|---|---|---|
| Buy PT | ✅ | ❌ (PT redeems 1:1 — use sell_pt to redeem instead) |
| Sell PT | ✅ | ✅ (convert works, redeems 1:1) |
| Buy/sell YT | ✅ | ❌ (YT is worthless) |
| Mint SY | ✅ | ✅ (always available) |
| Redeem SY | ✅ | ✅ (always available) |
| Mint PT+YT | ✅ (splits into PT + YT) | ❌ (not available) |
| Redeem PT+YT | ✅ (requires equal PT + YT) | ✅ (only PT needed — YT is $0) |
| Add LP | ✅ | ❌ (pool no longer generates fees — blocked by MCP) |
| Remove LP | ✅ | ✅ (exit position, then redeem-py) |

---

## Related Skills
- [`../pendle-data.md`](../pendle-data.md) -- market data and analytics
- [`../pendle-swap.md`](../pendle-swap.md) -- trading PT/YT, LP management
- [`../pendle-portfolio.md`](../pendle-portfolio.md) -- portfolio view
