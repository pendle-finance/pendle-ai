---
name: slippage-guide
description: 'Slippage & Price Impact Guide -- Reference'
---

# Slippage & Price Impact Guide -- Reference

---

## Price Impact Scale

`priceImpact` is returned as a decimal in the tool response.

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

All action tools use a fixed default slippage:

| Condition | Slippage | Reason |
|---|---|---|
| Default | `0.001` (0.1%) | Standard for all trades |
| User explicitly passes `slippage` | User's value | Always respected |

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
