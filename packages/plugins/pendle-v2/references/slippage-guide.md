---
name: slippage-guide
description: 'Slippage & Price Impact Guide -- Reference'
---

# Slippage & Price Impact Guide -- Reference

---

## Price Impact Scale

`priceImpact` is returned in `routes[0].data.priceImpact` as a decimal.

| Price Impact | Display | Meaning | Recommended Action |
|---|---|---|---|
| **< 0% (negative)** | e.g. -1.5% | Favorable -- you get MORE than spot | Normal; proceed (especially for YT) |
| **0% -- 0.5%** | e.g. 0.2% | Excellent | Proceed |
| **0.5% -- 1%** | e.g. 0.7% | Acceptable | Proceed; note in output |
| **1% -- 3%** | e.g. 1.8% | High | Warn user; suggest smaller size |
| **> 3%** | e.g. 4%+ | Very high | Strongly warn; recommend split or wait |

### Why YT Buys Show Negative Price Impact

YT purchases almost always show **negative price impact** (-1% to -2%). This is **normal and favorable**. Do NOT warn users about negative price impact on YT.

---

## Slippage Defaults

All action tools use the same auto-slippage logic:

| Condition | Slippage | Reason |
|---|---|---|
| Trade value ≥ $100 | `0.001` (0.1%) | Default — tight for normal-size trades |
| Trade value < $100 | `0.005` (0.5%) | Small trades are more sensitive to rounding |
| User explicitly passes `slippage` | User's value | Always respected |

The MCP resolves slippage by looking up the input token's decimals (cached 1 week from `GET /v1/assets/all`) and USD price (cached 5 min from `GET /v1/prices/assets`), then computing the trade's USD value.

If the lookup fails (unknown token, API error), the tool silently falls back to 0.5% (SLIPPAGE_SMALL_TRADE) to avoid blocking trades for tokens not in Pendle's registry.

### Never Use 0 Slippage

Even the native Pendle AMM has rounding during execution. Slippage of `0` will cause transactions to revert.

---

## When to Override Defaults

Let users override slippage only if:
1. They explicitly ask ("use 0.5% slippage")
2. Previous tx failed with "slippage too low"
3. Trading in a very low-liquidity market

---

## Related Skills
- [`../pendle-swap.md`](../pendle-swap.md)
