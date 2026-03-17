---
name: approval-rules
description: 'Approval Rules -- Reference'
---

# Approval Rules -- Reference

> All Pendle transactions go through the unified Convert API.

---

## The Core Rule

The Convert API returns `requiredApprovals[]` listing tokens that need **new** on-chain approval.

**`requiredApprovals` doesn't lie.**

- If it lists approvals → approve exactly those tokens/amounts to `transaction.to`
- If it's empty → current on-chain allowance is already sufficient, **do NOT auto-approve**
- If a tx fails due to allowance and `requiredApprovals` was empty → **report it as a bug**, don't silently fix it

```
requiredApprovals is EMPTY  →  allowance IS sufficient, do nothing extra
requiredApprovals has items →  approve exactly those to transaction.to
```

---

## Implementation Pattern

```typescript
// ONLY approve what requiredApprovals tells you — nothing more.
for (const approval of result.requiredApprovals ?? []) {
  await ensureApproval(approval.token, result.routes[0].tx.to, approval.amount);
}

// Submit the transaction
await wallet.sendTransaction(result.routes[0].tx);
```

**DO NOT** manually add extra approvals for sell/exit operations. The API handles this correctly.

---

## Claim Rewards Exception

`sdk_redeem_interests_and_rewards`:
- Returns `tokenApprovals: []` (always empty)
- No ERC-20 approval ever needed
- Transaction succeeds even with 0 pending rewards

---

## Related Skills
- [`../pendle-swap.md`](../pendle-swap.md)
