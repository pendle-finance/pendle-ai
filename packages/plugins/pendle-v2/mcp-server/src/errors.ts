// ── Structured Error Codes ───────────────────────────────────────────────────
// Every tool error is classified with a code, retryable flag, and suggested
// action. This lets calling agents decide programmatically whether to retry,
// reduce trade size, or surface the error to the user.

export enum PendleErrorCode {
  // ── Retryable ────────────────────────────────────────────────────────────
  RATE_LIMITED = 'RATE_LIMITED', // 429 — minute or weekly CU limit
  API_UNAVAILABLE = 'API_UNAVAILABLE', // 500/502/503/504 — transient server issue
  TIMEOUT = 'TIMEOUT', // Request timed out

  // ── Retryable (network) ─────────────────────────────────────────────────
  CONNECTION_REFUSED = 'CONNECTION_REFUSED', // ECONNREFUSED — API host unreachable

  // ── Not retryable (auth) ───────────────────────────────────────────────
  UNAUTHORIZED = 'UNAUTHORIZED', // 401 — invalid or missing API key
  UNPROCESSABLE = 'UNPROCESSABLE', // 422 — valid JSON but semantically wrong

  // ── Not retryable (bad input) ────────────────────────────────────────────
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND', // Token not in Pendle's asset registry
  MARKET_NOT_FOUND = 'MARKET_NOT_FOUND', // Market address not recognised
  NO_ROUTE_FOUND = 'NO_ROUTE_FOUND', // Convert API can't find a swap path
  MARKET_EXPIRED = 'MARKET_EXPIRED', // Operation not allowed post-maturity
  INVALID_PARAMS = 'INVALID_PARAMS', // Missing or malformed parameters

  // ── Not retryable (user action needed) ───────────────────────────────────
  PRICE_IMPACT_HIGH = 'PRICE_IMPACT_HIGH', // Price impact above safe threshold
  SLIPPAGE_ESTIMATION_FAILED = 'SLIPPAGE_ESTIMATION_FAILED', // Can't auto-determine slippage

  // ── Catch-all ────────────────────────────────────────────────────────────
  UNKNOWN = 'UNKNOWN',
}

export interface PendleError {
  code: PendleErrorCode;
  message: string;
  retryable: boolean;
  action: string;
}

/**
 * Classify a raw error into a structured PendleError.
 *
 * Inspects the error message for known patterns (API status codes, Pendle-specific
 * messages) and returns a classified error with retryable flag and suggested action.
 */
export function classifyError(err: unknown): PendleError {
  // Handle HttpResponse objects thrown by the generated PendleApi client.
  // The generated client throws `data` (an HttpResponse<T, E> extending Response) on non-ok responses.
  // Convert to a synthetic Error so the pattern matchers below can handle it uniformly.
  if (
    err != null &&
    typeof err === 'object' &&
    'status' in err &&
    'error' in err &&
    typeof (err as { status: unknown }).status === 'number'
  ) {
    const httpErr = err as { status: number; error: unknown };
    const detail = httpErr.error != null ? `: ${JSON.stringify(httpErr.error)}` : '';
    return classifyError(new Error(`Pendle API ${httpErr.status}${detail}`));
  }

  // Extract message including cause chain (e.g., fetch errors: "fetch failed" + cause: "ECONNREFUSED")
  const message =
    err instanceof Error
      ? err.cause
        ? `${err.message}: ${err.cause instanceof Error ? err.cause.message : String(err.cause)}`
        : err.message
      : String(err);
  const lower = message.toLowerCase();

  // ── Rate limiting ──────────────────────────────────────────────────────
  if (/\b429\b/.test(message) || lower.includes('rate limit')) {
    return {
      code: PendleErrorCode.RATE_LIMITED,
      message,
      retryable: true,
      action: 'Wait for rate limit reset, then retry. Consider upgrading your API plan.',
    };
  }

  // ── Server errors ──────────────────────────────────────────────────────
  if (/\b(500|502|503|504)\b/.test(message) || lower.includes('internal server error')) {
    return {
      code: PendleErrorCode.API_UNAVAILABLE,
      message,
      retryable: true,
      action: 'Pendle API returned a server error. Retry in a few seconds.',
    };
  }

  // ── Connection refused ────────────────────────────────────────────────
  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('enetunreach')
  ) {
    return {
      code: PendleErrorCode.CONNECTION_REFUSED,
      message,
      retryable: true,
      action: 'Cannot reach the Pendle API. Check your network connection, then retry.',
    };
  }

  // ── Timeout ────────────────────────────────────────────────────────────
  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('econnreset')) {
    return {
      code: PendleErrorCode.TIMEOUT,
      message,
      retryable: true,
      action: 'Request timed out. Retry.',
    };
  }

  // ── Token not found (from price-cache or asset lookup) ─────────────────
  if (lower.includes('not found in asset metadata') || lower.includes('no usd price available')) {
    return {
      code: PendleErrorCode.TOKEN_NOT_FOUND,
      message,
      retryable: false,
      action:
        "Token not in Pendle's registry. Verify the address and chain ID. Use resolve_token to look up the correct address.",
    };
  }

  // ── Market not found ───────────────────────────────────────────────────
  if (lower.includes('market') && (lower.includes('not found') || lower.includes('no market'))) {
    return {
      code: PendleErrorCode.MARKET_NOT_FOUND,
      message,
      retryable: false,
      action: 'Market address not found. Use get_markets to discover valid markets.',
    };
  }

  // ── No route / unsupported ─────────────────────────────────────────────
  if (
    lower.includes('no route') ||
    lower.includes('unsupported') ||
    lower.includes('cannot convert')
  ) {
    return {
      code: PendleErrorCode.NO_ROUTE_FOUND,
      message,
      retryable: false,
      action:
        'No swap route found. Check token addresses and try a different token pair or amount.',
    };
  }

  // ── Post-maturity guard ────────────────────────────────────────────────
  if (
    lower.includes('not available post-maturity') ||
    (lower.includes('expired') && lower.includes('market'))
  ) {
    return {
      code: PendleErrorCode.MARKET_EXPIRED,
      message,
      retryable: false,
      action: 'This market has expired. Use redeem-py (PT only) to exit, or find an active market.',
    };
  }

  // ── Slippage estimation ────────────────────────────────────────────────
  if (lower.includes('provide explicit slippage') || lower.includes('cannot determine')) {
    return {
      code: PendleErrorCode.SLIPPAGE_ESTIMATION_FAILED,
      message,
      retryable: false,
      action:
        'Auto-slippage failed. Retry with an explicit slippage parameter (e.g. 0.005 for 0.5%).',
    };
  }

  // ── Price impact ───────────────────────────────────────────────────────
  if (lower.includes('price impact')) {
    return {
      code: PendleErrorCode.PRICE_IMPACT_HIGH,
      message,
      retryable: false,
      action: 'Price impact is too high. Try a smaller trade amount or split into multiple trades.',
    };
  }

  // ── Unauthorized (401) ────────────────────────────────────────────────
  if (
    /\b401\b/.test(message) ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key')
  ) {
    return {
      code: PendleErrorCode.UNAUTHORIZED,
      message,
      retryable: false,
      action:
        'API key is missing or invalid. Set PENDLE_API_KEY environment variable with a valid key from https://api-v2.pendle.finance/dashboard',
    };
  }

  // ── Unprocessable entity (422) ──────────────────────────────────────────
  if (/\b422\b/.test(message) || lower.includes('unprocessable')) {
    return {
      code: PendleErrorCode.UNPROCESSABLE,
      message,
      retryable: false,
      action:
        'The request was well-formed but semantically invalid. Check token addresses, amounts, and chain ID for correctness.',
    };
  }

  // ── Invalid params (400-level) ─────────────────────────────────────────
  if (/\b400\b/.test(message) || lower.includes('malformed')) {
    return {
      code: PendleErrorCode.INVALID_PARAMS,
      message,
      retryable: false,
      action: 'Invalid parameters. Check token addresses, amounts, and chain ID.',
    };
  }

  // ── Catch-all ──────────────────────────────────────────────────────────
  return {
    code: PendleErrorCode.UNKNOWN,
    message,
    retryable: false,
    action: 'An unexpected error occurred. Check the error message for details.',
  };
}

/**
 * Format a classified error into an MCP text content block.
 * Returns structured JSON so calling agents can parse error codes programmatically.
 */
export function structuredErrorContent(err: unknown) {
  const classified = classifyError(err);
  return {
    isError: true as const,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            ok: false,
            error: classified,
          },
          null,
          2,
        ),
      },
    ],
  };
}
