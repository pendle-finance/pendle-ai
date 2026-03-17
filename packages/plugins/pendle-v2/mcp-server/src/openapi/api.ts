/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum TransactionAction {
  LONG_YIELD = "LONG_YIELD",
  SHORT_YIELD = "SHORT_YIELD",
  ADD_LIQUIDITY = "ADD_LIQUIDITY",
  REMOVE_LIQUIDITY = "REMOVE_LIQUIDITY",
}

export enum TransactionType {
  TRADES = "TRADES",
  LIQUIDITY = "LIQUIDITY",
}

export enum PendleAssetType {
  PENDLE_LP = "PENDLE_LP",
  SY = "SY",
  PT = "PT",
  YT = "YT",
}

export interface OrderFilledStatusResponse {
  /** BigInt string of netInputFromMaker, the unit is the same as making amount */
  netInputFromMaker: string;
  /** BigInt string of netOutputToMaker, the unit is SY if the order is PT_FOR_TOKEN or YT_FOR_TOKEN, otherwise, the unit it PT or YT depends on type of order */
  netOutputToMaker: string;
  /** BigInt string of feeAmount, in SY */
  feeAmount: string;
  /** BigInt string of notionalVolume, in SY */
  notionalVolume: string;
}

export interface OrderStateResponse {
  orderType: string;
  exchangeRate: string;
  psAmountToTaker: string;
  psAmountFromTaker: string;
  ysAmountToTaker: string;
  ysAmountFromTaker: string;
  fee: string;
  psRate: number;
  ysRate: number;
  /** In SY if the order is PY for token */
  netToMakerIfFullyFilled: string;
  /** The difference with currentMakingAmount is that this is in SY if currentMakingAmount in tokenIn */
  netFromMakerIfFullyFilled: string;
  notionalVolume: string;
  matchableAmount: string;
  notionalVolumeUSD: number;
}

export interface LimitOrderResponse {
  /** Hash of the order */
  id: string;
  /** Signature of order, signed by maker */
  signature: string;
  /** Chain id */
  chainId: number;
  /** BigInt string of salt. Salt is a random generated number to distinguish between orders.Because of some technical reason, this number must be dividable by 12421 */
  salt: string;
  /** BigInt string of expiry, in second */
  expiry: string;
  /** BigInt string of nonce */
  nonce: string;
  /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
  type: 0 | 1 | 2 | 3;
  /** Token used by user to make order */
  token: string;
  /** YT address */
  yt: string;
  /** Maker address */
  maker: string;
  /** Receiver address */
  receiver: string;
  /** BigInt string of making amount, the amount of token if the order is TOKEN_FOR_PT or TOKEN_FOR_YT, otherwise the amount of PT or YT */
  makingAmount: string;
  /** BigInt string of remaining making amount, the unit is the same as makingAmount */
  currentMakingAmount: string;
  /** BigInt string of lnImpliedRate. Natural logarithm of the implied rate */
  lnImpliedRate: string;
  /** BigInt string of failSafeRate */
  failSafeRate: string;
  /** Bytes string for permit */
  permit: string;
  /** Order filled status */
  orderFilledStatus: OrderFilledStatusResponse;
  isActive: boolean;
  isCanceled: boolean;
  /** @format date-time */
  createdAt: string;
  /** Order state */
  orderState?: OrderStateResponse;
  /**
   * Fully filled timestamp
   * @format date-time
   */
  fullyExecutedTimestamp?: string;
  /**
   * Canceled timestamp
   * @format date-time
   */
  canceledTimestamp?: string;
  /**
   * Timestamp of latest event
   * @format date-time
   */
  latestEventTimestamp?: string;
  /** SY address */
  sy: string;
  /** PT address */
  pt: string;
  /** Min(maker balance, maker allowance). How much token the maker has available to use for this order */
  makerBalance: string;
  /** Simulate result of the order to mint sy */
  failedMintSy: boolean;
  /** Error reason of the order to mint sy */
  failedMintSyReason: string;
  /** Bigint string of amount shown on order book */
  orderBookBalance: string;
  /** Making token address */
  makingToken: string;
  /** Taking token address */
  takingToken: string;
  /** LimitOrderStatus */
  status:
    | "FILLABLE"
    | "PARTIAL_FILLABLE"
    | "FAILED_TRANSFER_TOKEN"
    | "EMPTY_MAKER_BALANCE"
    | "CANCELLED"
    | "FULLY_FILLED"
    | "EXPIRED";
}

export interface LimitOrdersResponse {
  total: number;
  limit: number;
  skip: number;
  results: LimitOrderResponse[];
}

export interface LimitOrdersV2Response {
  total: number;
  limit: number;
  results: LimitOrderResponse[];
  resumeToken: string;
}

export interface GenerateLimitOrderDataDto {
  /** Chain Id */
  chainId: number;
  /** YT address */
  YT: string;
  /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
  orderType: 0 | 1 | 2 | 3;
  /** Input token if type is TOKEN_FOR_PT or TOKEN_FOR_YT, output token otherwise */
  token: string;
  /** Maker address */
  maker: string;
  /** BigInt string of making amount, the amount of token if the order is TOKEN_FOR_PT or TOKEN_FOR_YT, otherwise the amount of PT or YT */
  makingAmount: string;
  /** Implied APY of this limit order */
  impliedApy: number;
  /** Timestamp of order's expiry, in seconds */
  expiry: string;
}

export interface GenerateLimitOrderDataResponse {
  /** Chain id */
  chainId: number;
  /** YT address */
  YT: string;
  /** BigInt string of salt. Salt is a random generated number to distinguish between orders.Because of some technical reason, this number must be dividable by 12421 */
  salt: string;
  /** Limit order expiry, in string */
  expiry: string;
  /** Nonce of the limit order, this will help the maker to cancel all the limit order they created */
  nonce: string;
  /** Input token if type is TOKEN_FOR_PT or TOKEN_FOR_YT, output token otherwise */
  token: string;
  /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
  orderType: 0 | 1 | 2 | 3;
  /** BigInt string of failSafeRate */
  failSafeRate: string;
  /** Maker's address */
  maker: string;
  /** Maker's address */
  receiver: string;
  /** BigInt string of making amount, the amount of token if the order is TOKEN_FOR_PT or TOKEN_FOR_YT, otherwise the amount of PT or YT */
  makingAmount: string;
  permit: string;
  /**
   * ln(impliedRate) * 10**18, returned as bigint string
   * @format int64
   */
  lnImpliedRate: number;
}

export interface HttpErrorResponse {
  message: string;
  statusCode: number;
  error: string;
}

export interface GenerateScaledOrderDataDto {
  /** Chain Id */
  chainId: number;
  /** YT address */
  YT: string;
  /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
  orderType: 0 | 1 | 2 | 3;
  /** Input token if type is TOKEN_FOR_PT or TOKEN_FOR_YT, output token otherwise */
  token: string;
  /** Maker address */
  maker: string;
  /** BigInt string of making amount, the amount of token if the order is TOKEN_FOR_PT or TOKEN_FOR_YT, otherwise the amount of PT or YT */
  makingAmount: string;
  /** Lower implied APY of this scaled order */
  lowerImpliedApy: number;
  /** Upper implied APY of this scaled order */
  upperImpliedApy: number;
  /** Upper implied APY of this scaled order */
  orderCount: number;
  /** Scaled Order Distribution Type {  } */
  sizeDistribution: "flat" | "ascending" | "descending";
  /** Timestamp of order's expiry, in seconds */
  expiry: string;
}

export interface GenerateScaledOrderResponse {
  /** List of generated limit orders */
  orders: GenerateLimitOrderDataResponse[];
}

export interface CreateLimitOrderDto {
  /** Chain Id */
  chainId: number;
  /** Signature of order, signed by maker */
  signature: string;
  /** BigInt string of salt */
  salt: string;
  /** BigInt string of expiry */
  expiry: string;
  /** BigInt string of nonce */
  nonce: string;
  /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
  type: 0 | 1 | 2 | 3;
  /** Token used by user to make order */
  token: string;
  /** YT address */
  yt: string;
  /** Maker address */
  maker: string;
  /** Receiver address */
  receiver: string;
  /** BigInt string of making amount */
  makingAmount: string;
  /** BigInt string of lnImpliedRate */
  lnImpliedRate: string;
  /** BigInt string of failSafeRate */
  failSafeRate: string;
  /** Bytes string for permit */
  permit: string;
}

export interface LimitOrderTakerResponse {
  order: LimitOrderResponse;
  /** Amount to be used to fill the order, the unit is the same as the unit of limit order' making amount */
  makingAmount: string;
  /** Amount from taker need to fully fill this order, the unit is SY if the market order is TOKEN_FOR_PT or TOKEN_FOR_YT, otherwise, the unit it PT or YT depends on type of order */
  netFromTaker: string;
  /** Actual making amount to taker, the unit is SY if the market order is PT_FOR_TOKEN or YT_FOR_TOKEN, otherwise, the unit it PT or YT depends on type of order */
  netToTaker: string;
}

export interface LimitOrdersTakerResponse {
  total: number;
  limit: number;
  skip: number;
  results: LimitOrderTakerResponse[];
}

export interface OrderBookV2EntryResponse {
  /** Order's implied apy, rounded to precision */
  impliedApy: number;
  /**
   * Bigint string of entry size, in PT/YT amounts to fill this entry
   * @format int64
   */
  limitOrderSize: number;
  /**
   * Bigint string of entry size, in AMM LP tokens (if applicable)
   * @format int64
   */
  ammSize?: number;
}

export interface OrderBookV2Response {
  longYieldEntries: OrderBookV2EntryResponse[];
  shortYieldEntries: OrderBookV2EntryResponse[];
}

export interface GetAssetPricesCrossChainResponse {
  /**
   * Assets prices mapped by chainId-address
   * @example {"1-0x5fe30ac5cb1abb0e44cdffb2916c254aeb368650":0.9989673642973003,"1-0xd393d1ddd6b8811a86d925f5e14014282581bc04":1.001712}
   */
  prices: Record<string, number>;
  /** Total number of assets */
  total: number;
  /** Number of assets got skipped */
  skip: number;
  /** Number of assets limited by the query */
  limit?: number | null;
}

export interface PriceOHLCVCSVResponse {
  /** Total number of data points available */
  total: number;
  /**
   * Always return USD
   * @deprecated
   */
  currency: string;
  /** Time frame of each OHLCV data point (e.g., "1h", "1d", "1w") */
  timeFrame: string;
  /** Start timestamp of the data range in seconds */
  timestamp_start: number;
  /** End timestamp of the data range in seconds */
  timestamp_end: number;
  /**
   * Resulting CSV string following the format: time,open,high,low,close,volume
   * @example "time,open,high,low,close,volume
   * 1756245600,42.4563,42.4563,42.4563,42.4563,0.0000"
   */
  results: string;
}

export interface AssetDataCrossChain {
  /**
   * asset name
   * @example "PT FRAX-USDC"
   */
  name: string;
  /**
   * asset decimals
   * @example 18
   */
  decimals: number;
  /**
   * asset address
   * @example "0x5fe30ac5cb1abb0e44cdffb2916c254aeb368650"
   */
  address: string;
  /**
   * asset symbol
   * @example "PT-FRAXUSDC_CurveLP Convex-30MAR2023"
   */
  symbol: string;
  /**
   * asset tags
   * @example ["PT"]
   */
  tags: string[];
  /**
   * asset expiry
   * @example "2023-03-30T00:00:00.000Z"
   */
  expiry: string;
  /**
   * asset pro icon
   * @example "https://storage.googleapis.com/prod-pendle-bucket-a/images/uploads/0d3199a2-0565-4355-ad52-6bfdc67e3467.svg"
   */
  proIcon: string;
  /**
   * chain id
   * @example 1
   */
  chainId: number;
}

export interface GetAllAssetsCrossChainResponse {
  assets: AssetDataCrossChain[];
}

export interface YieldRangeResponse {
  /** Minimum historical implied APY for this market */
  min: number;
  /** Maximum historical implied APY for this market */
  max: number;
}

export interface MarketDetailsV2Entity {
  /**
   * market liquidity in USD, this is the liquidity of PT and SY in the AMM
   * @example 1234567.89
   */
  liquidity: number;
  /**
   * market total TVL (including floating PT that are not in the AMM) in USD
   * @example 1234567.89
   */
  totalTvl: number;
  /**
   * market 24h trading volume in USD
   * @example 1234567.89
   */
  tradingVolume: number;
  /**
   * APY of the underlying asset
   * @example 0.01
   */
  underlyingApy: number;
  /**
   * swap fee APY for LP holders, without boosting
   * @example 0.01
   */
  swapFeeApy: number;
  /**
   * APY from Pendle rewards
   * @example 0.456
   */
  pendleApy: number;
  /**
   * implied APY of market
   * @example 0.123
   */
  impliedApy: number;
  /**
   * market fee rate
   * @example 0.003
   */
  feeRate: number;
  /** Historical implied APY range for this market */
  yieldRange: YieldRangeResponse;
  /**
   * APY including yield, swap fee and Pendle rewards without boosting
   * @example 0.123
   */
  aggregatedApy: number;
  /**
   * APY when maximum boost is applies
   * @example 0.123
   */
  maxBoostedApy: number;
  /**
   * total PT in the market
   * @example 1234567.89
   */
  totalPt: number;
  /**
   * total SY in the market
   * @example 1234567.89
   */
  totalSy: number;
  /**
   * total supply of the LP token
   * @example 1234567.89
   */
  totalSupply: number;
  /**
   * total active supply of the LP token, used for calculate boosting
   * @example 1234567.89
   */
  totalActiveSupply: number;
}

export interface PointMetadataEntity {
  key: string;
  /** Either "multiplier" or "points-per-asset" */
  type: "multiplier" | "points-per-asset";
  /** Either "basic" or "lp" */
  pendleAsset: "basic" | "lp";
  value: number;
  perDollarLp: boolean;
}

export interface ExternalProtocolInfoEntity {
  id: string;
  name: string;
  iconUrl: string;
  category: string;
  url: string;
  description?: string;
}

export interface ExternalProtocolMetadataEntity {
  protocol: ExternalProtocolInfoEntity;
  integrationUrl: string;
  description: string;
  curatorAddress?: string;
  subtitle?: string;
  liquidity?: number;
  borrowApy?: number;
  supplyApy?: number;
  totalSupply?: number;
  supplyCap?: number;
  maxLtv?: number;
  chainId: number;
  spokeAddress?: string;
}

export interface MarketExternalProtocolsEntity {
  pt: ExternalProtocolMetadataEntity[];
  yt: ExternalProtocolMetadataEntity[];
  lp: ExternalProtocolMetadataEntity[];
  crossPt: ExternalProtocolMetadataEntity[];
}

export interface MarketCrossChainDataV2 {
  /**
   * market name
   * @example "crvUSD"
   */
  name: string;
  /**
   * market address
   * @example "0x386f90eb964a477498b528a39d9405e73ed4032b"
   */
  address: string;
  /**
   * market expiry date
   * @example "2024-03-28T00:00:00.000Z"
   */
  expiry: string;
  /**
   * market pt id
   * @example "1-0xb87511364014c088e30f872efc4a00d7efb843ac"
   */
  pt: string;
  /**
   * market yt id
   * @example "1-0xed97f94dd94255637a054098604e0201c442a3fd"
   */
  yt: string;
  /**
   * market sy id
   * @example "1-0xe05082b184a34668cd8a904d85fa815802bbb04c"
   */
  sy: string;
  /**
   * market underlying asset id
   * @example "1-0xa663b02cf0a4b149d2ad41910cb81e23e1c41c32"
   */
  underlyingAsset: string;
  /**
   * accounting asset id
   * @example "1-0xa663b02cf0a4b149d2ad41910cb81e23e1c41c32"
   */
  accountingAsset: string;
  /** reward token ids */
  rewardTokens: string[];
  /** accepted input token ids for minting SY */
  inputTokens: string[];
  /** output token ids when redeeming SY */
  outputTokens: string[];
  /** Market details including liquidity, APY, fee rate, and yield range */
  details: MarketDetailsV2Entity;
  /** Whether the market is new */
  isNew: boolean;
  /** Whether the market is prime */
  isPrime: boolean;
  /**
   * Market deployed timestamp
   * @format date-time
   */
  timestamp: string;
  /** LP wrapper address */
  lpWrapper?: string;
  /**
   * Market category IDs
   * @example ["btc","stables"]
   */
  categoryIds?: string[];
  /** Whether the market is volatile */
  isVolatile?: boolean;
  /**
   * chain id
   * @example 1
   */
  chainId: number;
  /** Points reward configurations for this market, if any */
  points?: PointMetadataEntity[];
  /** External protocol integrations (e.g. Aave, Morpho, Euler) available for this market's assets */
  externalProtocols?: MarketExternalProtocolsEntity;
}

export interface GetMarketsCrossChainV2Response {
  /** Total number of markets matching the filter */
  total: number;
  /** Number of markets per page */
  limit: number;
  /** Number of markets skipped */
  skip: number;
  /** Paginated list of markets with points and external protocol data */
  results: MarketCrossChainDataV2[];
}

export interface MarketHistoricalDataPoint {
  /**
   * Timestamp in ISO format
   * @format date-time
   */
  timestamp: string;
  /** APY when maximum boost is applied */
  maxApy?: number;
  /** APY including yield, swap fee and Pendle rewards without boosting */
  baseApy?: number;
  /** APY of the underlying asset */
  underlyingApy?: number;
  /** Implied APY of market */
  impliedApy?: number;
  /** Market liquidity (TVL in the pool) in USD */
  tvl?: number;
  /** Market total TVL (including floating PT that are not in the AMM) in USD */
  totalTvl?: number;
  /** Annual percentage yield from the underlying asset interest */
  underlyingInterestApy?: number;
  /** Annual percentage yield from the underlying asset rewards */
  underlyingRewardApy?: number;
  /** Floating APY for YT holders (underlyingApy - impliedApy) */
  ytFloatingApy?: number;
  /** Swap fee APY for LP holders, without boosting */
  swapFeeApy?: number;
  /** APY for voters (vePENDLE holders) from voting on this pool */
  voterApr?: number;
  /** APY from Pendle rewards */
  pendleApy?: number;
  /** APY from LP reward tokens */
  lpRewardApy?: number;
  /** Total PT in the market */
  totalPt?: number;
  /** Total SY in the market */
  totalSy?: number;
  /** Total supply of the LP token */
  totalSupply?: number;
  /** PT price in USD */
  ptPrice?: number;
  /** YT price in USD */
  ytPrice?: number;
  /** SY price in USD */
  syPrice?: number;
  /** LP price in USD */
  lpPrice?: number;
  /** Last epoch votes */
  lastEpochVotes?: number;
  /** 24h trading volume in USD */
  tradingVolume?: number;
  /** Explicit swap fee in USD (only available for daily and weekly timeframes) */
  explicitSwapFee?: number;
  /** Implicit swap fee in USD (only available for daily and weekly timeframes) */
  implicitSwapFee?: number;
  /** Limit order fee in USD (only available for daily and weekly timeframes) */
  limitOrderFee?: number;
}

export interface MarketHistoricalDataResponse {
  /** Total number of data points available */
  total: number;
  /**
   * Start timestamp of the data range
   * @format date-time
   */
  timestamp_start: string;
  /**
   * End timestamp of the data range
   * @format date-time
   */
  timestamp_end: string;
  /** Array of historical data points */
  results: MarketHistoricalDataPoint[];
}

export interface MarketTokensResponse {
  /** tokens can be use for tokenMintSy */
  tokensMintSy: string[];
  /** tokens can be use for tokenRedeemSy */
  tokensRedeemSy: string[];
  /** input tokens of swap or zap function */
  tokensIn: string[];
  /** output tokens of swap or zap function */
  tokensOut: string[];
}

export interface SupportedAggregator {
  /**
   * Name of the aggregator, e.g., kyberswap, okx, odos, paraswap
   * @example "kyberswap"
   */
  name: string;
  /**
   * Computing unit required for the aggregator
   * @example 5
   */
  computingUnit: number;
}

export interface SupportedAggregatorsResponse {
  /** List of supported aggregators with their computing units */
  aggregators: SupportedAggregator[];
}

export interface GetSpotSwappingPriceResponse {
  /** underlying token address that will be used for swapping */
  underlyingToken: string;
  /** number of PT by swapping 1 underlying token. If the swap can not be done, this value will be null */
  underlyingTokenToPtRate: object | null;
  /** number of underlying token by swapping 1 PT. If the swap can not be done, this value will be null */
  ptToUnderlyingTokenRate: object | null;
  /** number of YT by swapping 1 underlying token. If the swap can not be done, this value will be null */
  underlyingTokenToYtRate: object | null;
  /** number of underlying token by swapping 1 YT. If the swap can not be done, this value will be null */
  ytToUnderlyingTokenRate: object | null;
  /** implied apy of the given market */
  impliedApy: number;
}

export interface TransactionDto {
  /** Transaction data */
  data: string;
  /** Transaction receiver */
  to: string;
  /** Transaction sender */
  from: string;
  /** Transaction value */
  value: string;
}

export interface TokenAmountResponse {
  token: string;
  amount: string;
}

export interface PriceImpactBreakDownData {
  internalPriceImpact: number;
  externalPriceImpact: number;
}

export interface ImpliedApy {
  before: number;
  after: number;
}

export interface FeeUsd {
  usd: number;
}

export interface ContractParamInfo {
  /** Method name */
  method: string;
  /** Contract call parameters name */
  contractCallParamsName: string[];
  /** Contract call parameters */
  contractCallParams: any[][];
}

export interface ParamsBreakdown {
  selfCall1: ContractParamInfo;
  selfCall2?: ContractParamInfo;
  reflectCall: ContractParamInfo;
}

export interface SdkResponse {
  /** Method name */
  method: string;
  /** Contract call parameters name */
  contractCallParamsName: string[];
  /** Contract call parameters */
  contractCallParams: any[][];
  /** Transaction data */
  tx: TransactionDto;
  tokenApprovals?: TokenAmountResponse[];
}

export interface RedeemInterestsAndRewardsResponse {
  /** Method name */
  method: string;
  /** Contract call parameters name */
  contractCallParamsName: string[];
  /** Contract call parameters */
  contractCallParams: any[][];
  /** Transaction data */
  tx: TransactionDto;
  tokenApprovals?: TokenAmountResponse[];
}

export interface ConvertData {
  aggregatorType: string;
  priceImpact: number;
  impliedApy?: ImpliedApy;
  priceImpactBreakDown: PriceImpactBreakDownData;
  effectiveApy?: number;
  /** Parameter breakdown for transfer liquidity */
  paramsBreakdown?: ParamsBreakdown;
  /** Fee in USD */
  fee?: FeeUsd;
}

export interface ConvertResponse {
  /** Contract params info */
  contractParamInfo: ContractParamInfo;
  /** Transaction data */
  tx: TransactionDto;
  /** Output token amounts from the action */
  outputs: TokenAmountResponse[];
  data: ConvertData;
}

export interface MultiRouteConvertResponse {
  /** The action that was performed */
  action:
    | "swap"
    | "add-liquidity"
    | "remove-liquidity"
    | "exit-market"
    | "transfer-liquidity"
    | "roll-over-pt"
    | "add-liquidity-dual"
    | "remove-liquidity-dual"
    | "mint-py"
    | "redeem-py"
    | "mint-sy"
    | "redeem-sy"
    | "pendle-swap"
    | "convert-lp-to-pt";
  /** Input token amounts for the action */
  inputs: TokenAmountResponse[];
  requiredApprovals?: TokenAmountResponse[];
  routes: ConvertResponse[];
  /** Reward token amounts from redeem action */
  rewards?: TokenAmountResponse[];
}

export interface TokenAmountDto {
  /** Token address */
  token: string;
  /** Token amount in wei */
  amount: string;
}

export interface OKXCustomParamsDto {
  fromTokenReferrerWalletAddress?: string;
  toTokenReferrerWalletAddress?: string;
  feePercent?: number;
  positiveSlippagePercent?: number;
}

export interface ConvertV3Dto {
  /** Recipient address for transaction output */
  receiver?: string;
  /** Maximum slippage tolerance (0-1, where 0.01 equals 1%) */
  slippage: number;
  /**
   * Enable swap aggregator to swap between tokens that cannot be natively converted from/to the underlying asset
   * @default false
   */
  enableAggregator?: boolean;
  /** List of aggregator names to use for the swap. If not provided, default aggregators will be used.List of supported aggregator can be found at: [getSupportedAggregators](#tag/sdk/get/v1/sdk/{chainId}/supported-aggregators) */
  aggregators?: string[];
  /** List of input tokens and their amounts */
  inputs: TokenAmountDto[];
  /** Output token addresses */
  outputs: string[];
  /**
   * Redeem rewards
   * @default false
   */
  redeemRewards?: boolean;
  /**
   * Aggregators needScale value, only set to true when amounts are updated onchain. When enabled, please make sure to buffer the amountIn by about 2%
   * @default false
   */
  needScale?: boolean;
  /** Available fields: `impliedApy`, `effectiveApy`. Comma separated list of fields to return. For example: `field1,field2`. More fields will consume more computing units. */
  additionalData?: string;
  /**
   * To use limit orders when converting, default to true
   * @default true
   */
  useLimitOrder?: boolean;
  okxSwapParams?: OKXCustomParamsDto;
}

export interface SwapWithFixedPricePtAmmData {
  /** Net token output amount */
  netTokenOut: string;
}

export interface SwapWithFixedPricePtAmmResponse {
  /** Method name */
  method: string;
  /** Contract call parameters name */
  contractCallParamsName: string[];
  /** Contract call parameters */
  contractCallParams: any[][];
  /** Transaction data */
  tx: TransactionDto;
  tokenApprovals?: TokenAmountResponse[];
  data: SwapWithFixedPricePtAmmData;
}

export interface PtCrossChainMetadataResponse {
  /** Array of token addresses that the PT can be swapped to */
  pairedTokensOut: string[];
  /** The address of the AMM */
  ammAddress?: string;
}

export interface NotionalV5 {
  /** Notional amount of PT traded */
  pt: number;
}

export interface TransactionV5Response {
  /** Unique identifier of the transaction */
  id: string;
  /** Market address where the transaction occurred */
  market: string;
  /**
   * Timestamp when the transaction occurred
   * @format date-time
   */
  timestamp: string;
  /** Chain ID where the transaction occurred */
  chainId: number;
  /** Transaction hash on the blockchain */
  txHash: string;
  /** Transaction value in USD */
  value: number;
  /** Transaction type (e.g., TRADES, ADD_LIQUIDITY, REMOVE_LIQUIDITY) */
  type: string;
  /** Transaction action (e.g., BUY_PT, SELL_PT, ADD_LIQUIDITY_DUAL) */
  action: string;
  /** Original transaction sender address */
  txOrigin?: string;
  /** Weighted average implied APY for this transaction */
  impliedApy: number;
  /** Notional amounts traded (only for TRADES type) */
  notional?: NotionalV5;
}

export interface TransactionsV5Response {
  /** Total number of transactions available */
  total: number;
  /** Resume token for pagination. Use this to continue a previous query. Use this token in the next request. Can be undefined if the query is at the end of the results. */
  resumeToken?: string;
  /** Maximum number of results returned */
  limit: number;
  /** Number of results skipped for pagination */
  skip: number;
  /** List of transactions */
  results: TransactionV5Response[];
}

export interface GetDistinctUsersFromTokenEntity {
  /**
   * Array of unique wallet addresses (lowercase) that have interacted with the specified token. Addresses are deduplicated across both Sentio and internal data sources.
   * @example ["0x1234567890123456789012345678901234567890","0x0987654321098765432109876543210987654321","0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"]
   */
  users: string[];
}

export interface MerkleRewardsResponse {
  /** Array of unclaimed merkle campaigns */
  claimableRewards: MerkleUserCampaignResponse[];
  /** Array of claimed merkle campaigns */
  claimedRewards: MerkleUserCampaignResponse[];
}

export interface MerkleProofResponse {
  proof: string[];
  accruedAmount: string;
  /** @format date-time */
  updatedAt: string;
  /** Calldata to verify the proof */
  verifyCallData?: string;
  /** Merkle root hash of the merkle tree */
  merkleRoot: string;
}

export interface ChainIdsResponse {
  chainIds: number[];
}

export interface ClaimTokenAmount {
  /**
   * Token id
   * @example "1-0x123..."
   */
  token: string;
  /**
   * Amount of tokens
   * @example "1000000000000000000"
   */
  amount: string;
}

export interface Position {
  /**
   * Balance of the position
   * @example "1000000000000000000"
   */
  balance: string;
  /**
   * Active balance of the position (for LP only)
   * @example "1000000000000000000"
   */
  activeBalance?: string;
  /**
   * Valuation of the position in USD
   * @example 10
   */
  valuation: number;
  /** Array of claimable rewards */
  claimTokenAmounts?: ClaimTokenAmount[];
}

export interface CrossPtPosition {
  /**
   * Spoke PT
   * @example "0x123..."
   */
  spokePt: string;
  /**
   * Balance of the position
   * @example "1000000000000000000"
   */
  balance: string;
}

export interface MarketPosition {
  /**
   * Unique identifier of the market
   * @example "1-0xabc..."
   */
  marketId: string;
  /** Principal token (PT) position */
  pt: Position;
  /** Yield token (YT) position */
  yt: Position;
  /** Liquidity provider (LP) token position */
  lp: Position;
  /** Array of cross PT positions */
  crossPtPositions: CrossPtPosition[];
}

export interface SyPosition {
  /**
   * Unique identifier of the market
   * @example "1-0xabc"
   */
  syId: string;
  /**
   * Sy token (SY) balance in wei
   * @example "1000000000000000000"
   */
  balance: string;
  /** Array of claimable rewards */
  claimTokenAmounts?: ClaimTokenAmount[];
}

export interface UserPositionsResponse {
  /**
   * Chain ID
   * @example 1
   */
  chainId: number;
  /**
   * Total number of open positions
   * @example 100
   */
  totalOpen: number;
  /**
   * Total number of closed positions
   * @example 100
   */
  totalClosed: number;
  /**
   * Total number of SY positions
   * @example 100
   */
  totalSy: number;
  /** Array of user token positions */
  openPositions: MarketPosition[];
  /** Array of closed user token positions */
  closedPositions: MarketPosition[];
  /** Array of user SY positions */
  syPositions: SyPosition[];
  /**
   * Date time of the last update
   * @format date-time
   * @example "2021-01-01T00:00:00.000Z"
   */
  updatedAt: string;
  /**
   * Error message when there is something wrong
   * @example "Error message"
   */
  errorMessage?: string;
}

export interface UserPositionsCrossChainResponse {
  /** Array of user positions */
  positions: UserPositionsResponse[];
}

export interface MerkleUserCampaignResponse {
  user: string;
  token: string;
  merkleRoot: string;
  chainId: number;
  assetId: string;
  amount: string;
  /** @format date-time */
  toTimestamp: string;
  /** @format date-time */
  fromTimestamp: string;
}

export interface ValuationEntity {
  usd: number;
  asset: number;
  eth: number;
}

export interface SpendUnitData {
  /** Balance of user in wei */
  unit: number;
  /** Total spent to purchase this asset */
  spent_v2: ValuationEntity;
}

export interface PriceAssetData {
  /** PT price in the market's accounting asset at the time of the transaction */
  pt: number;
  /** YT price in the market's accounting asset at the time of the transaction */
  yt: number;
  /** LP price in the market's accounting asset at the time of the transaction */
  lp: number;
}

export interface PnLTransactionEntity {
  /** Chain ID where the transaction occurred */
  chainId: number;
  /** LP market contract address */
  market: string;
  /** User wallet address */
  user: string;
  /**
   * Block timestamp of the transaction
   * @format date-time
   */
  timestamp: string;
  /** Type of Pendle operation performed (swap, liquidity, limit order, mint/redeem, transfer, or reward claim) */
  action:
    | "addLiquidityDualTokenAndPt"
    | "addLiquiditySinglePt"
    | "addLiquiditySingleToken"
    | "addLiquiditySingleTokenKeepYt"
    | "removeLiquidityDualTokenAndPt"
    | "removeLiquidityToPt"
    | "removeLiquiditySingleToken"
    | "mintPy"
    | "redeemPy"
    | "swapYtToPt"
    | "swapPtToYt"
    | "redeemYtRewards"
    | "redeemYtYield"
    | "redeemMarketRewards"
    | "buyPt"
    | "sellPt"
    | "transferPtIn"
    | "transferPtOut"
    | "buyYt"
    | "sellYt"
    | "transferYtIn"
    | "transferYtOut"
    | "transferLpIn"
    | "transferLpOut"
    | "sellYtLimitOrder"
    | "buyYtLimitOrder"
    | "sellPtLimitOrder"
    | "buyPtLimitOrder";
  /** PT token balance change and cost basis for this transaction */
  ptData: SpendUnitData;
  /** YT token balance change and cost basis for this transaction */
  ytData: SpendUnitData;
  /** LP token balance change and cost basis for this transaction */
  lpData: SpendUnitData;
  /** Prices of PT, YT, and LP in the market's accounting asset at the time of the transaction */
  priceInAsset: PriceAssetData;
  /** Profit or loss of the transaction */
  profit: ValuationEntity;
  /** Total value of the transaction in asset */
  txValueAsset: number;
  /** Market asset price in USD */
  assetUsd: number;
  /** Market asset price in ETH */
  assetEth: number;
  /** PT exchange rate at the time of the transaction */
  ptExchangeRate: number;
  /** Effective PT exchange rate of this transaction */
  effectivePtExchangeRate?: number;
  /** PT exchange rate of market after the transaction */
  ptExchangeRateAfter?: number;
  /** Transaction hash */
  txHash?: string;
}

export interface TransactionsResponseEntity {
  /** Total number of matching transactions */
  total: number;
  /** Paginated list of transactions */
  results: PnLTransactionEntity[];
}

export interface MinimalAssetAmountEntity {
  token: string;
  /** Amount of token in wei */
  rawAmount: string;
}

export interface UserGainedPnlResponseEntity {
  netGain: ValuationEntity;
  totalSpent: ValuationEntity;
  preSeasonUnclaimedRewards: MinimalAssetAmountEntity[] | null;
  /** @deprecated */
  peakTvlUsd: number;
  maxCapital: ValuationEntity;
  tradingVolume: number;
}

export interface UserMarketGainedPnlEntity {
  market: string;
  chainId: number;
  pnl: UserGainedPnlResponseEntity;
  /** @deprecated */
  ptBalance: number;
  /** @deprecated */
  ytBalance: number;
  /** @deprecated */
  lpBalance: number;
  ptData: SpendUnitData;
  ytData: SpendUnitData;
  lpData: SpendUnitData;
}

export interface UserGainedPnlPositionsResponseEntity {
  total: number;
  positions: UserMarketGainedPnlEntity[];
}

export interface AirdropToken {
  /** token name */
  token: string;
  /** token amount */
  amount: number;
  /** token amount in USD */
  valueInUSD: number;
}

export interface SPendleHistoricalDataResponse {
  timestamps: number[];
  revenues: number[];
  fees: number[];
  airdrops: number[];
  aprs: number[];
  allTimeRevenues: number;
  /** buyback amount */
  buybackAmounts: number[];
  /** airdrop amount in USD */
  airdropInUSDs: number[];
  airdropBreakdowns: AirdropToken[][];
}

export interface HistoricalDataResponse {
  timestamps: number[];
  revenues: number[];
  fees: number[];
  airdrops: number[];
  aprs: number[];
  allTimeRevenues: number;
}

export interface GetSpendleStaticDataResponse {
  /** total pendle staked */
  totalPendleStaked: string;
  /** total spendle */
  totalStakedInSpendle: string;
  /** total spendle staked */
  virtualSpendleFromVependle: string;
  /**
   * last epoch apr: deprecated. Please use first value of apr in sPendleHistoricalData, if it is not available, please use apr of vePendleHistoricalData
   * @deprecated
   */
  lastEpochApr: number;
  /**
   * last epoch buyback amount: deprecated. Please use first value of fee in sPendleHistoricalData, if it is not available, please use fee of vePendleHistoricalData
   * @deprecated
   */
  lastEpochBuybackAmount: number;
  /** total vePendle staked */
  sPendleHistoricalData: SPendleHistoricalDataResponse;
  /** vependle monthly historical data */
  vependleHistoricalData: HistoricalDataResponse;
}

export interface UserAllTimeRewards {
  /** @example {"1-0x123...abc":{"totalAmount":"1000000000000000000","totalAmountInUsd":350.25},"137-0x456...def":{"totalAmount":"750000000000000000","totalAmountInUsd":262.68}} */
  tokens: object;
  /** @format date-time */
  lastDistributionAt: string;
}

export interface VePendlePositionData {
  amount: string;
  expiry: number;
}

export interface GetSPendleRewardResponse {
  ethAccruedAmount: string;
  multiTokenProof: MerkleProofResponse;
  allTimeRewards: UserAllTimeRewards;
  vePendlePositionData?: VePendlePositionData;
}

export interface MarketEmission {
  /** Chain ID of the market */
  chainId: number;
  /** Contract address of the market */
  address: string;
  /** Total PENDLE emission allocated to this market */
  totalIncentive: number;
  /** Emission allocated based on TVL proportion */
  tvlIncentive: number;
  /** Emission allocated based on fee proportion */
  feeIncentive: number;
  /** Discretionary emission manually assigned to this market */
  discretionaryIncentive: number;
  /** Co-bribing emission allocated to this market */
  cobribingIncentive: number;
}

export interface GetPendleEmissionResponse {
  /** List of markets with their emission breakdown */
  markets: MarketEmission[];
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "https://staging-api.pendle.finance/core";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data.data;
    });
  };
}

/**
 * @title Pendle V2 API Docs
 * @version 1.0
 * @baseUrl https://staging-api.pendle.finance/core
 * @contact
 *
 *
 * ## Terms used in the documentation/API
 *
 * Below are some terms used in the documentation/API:
 *
 * - Pendle Assets/Tokens: PT, YT, LP, SY
 * - Non-Pendle Assets: other tokens that are not Pendle assets, such as USDC, USDT, DAI, etc.
 * - Asset ID/Token Id: Is the combination of chain id and token address, e.g. 1-0x5fe30ac5cb1abb0e44cdffb2916c254aeb368650
 * - Computing unit: Cost of an API call, this is use to rate limit the API calls. More on it at [our document](https://docs.pendle.finance/pendle-v2/Developers/Backend/ApiOverview#rate-limiting)
 * - APY/APR/ROI Format: All APY, APR, and ROI values are returned as decimals. For example, 0.5 means 50%, 0.05 means 5%, 1.2 means 120%
 * - Percentage Change Format: All percentage change values (e.g., 24h changes) are returned as decimals. For example, 0.05 means 5% change
 * - Logarithmic Values: Some fields like `lnImpliedRate` are natural logarithms. To get the actual rate, use e^(value)
 *
 * ## Recommended way to fetch data
 *
 * We have a lot of markets, if you call an API for each market, it will be very slow and you will likely get rate limited. Therefore, in some APIs we support fetch all data at once (example the get all markets data, get all assets data/prices), you could use that to fetch all data at once. They also support filter by asset id, type, so if you don't want to fetch, you can filter it down to the specific ones you want.
 *
 * For detailed documentation, visit:
 *
 * [https://docs.pendle.finance/pendle-v2/Developers/Backend/ApiOverview](https://docs.pendle.finance/pendle-v2/Developers/Backend/ApiOverview)
 *
 * ## Support
 *
 * - We have a telegram for developers to ask about the API at [https://t.me/peepo_the_engineer_bot](https://t.me/peepo_the_engineer_bot)
 * - We have an announcement channel for API updates at [https://t.me/pendledevelopers](https://t.me/pendledevelopers), follow it to get the latest updates on the API.
 *
 * ## FAQ
 *
 * - How to fetch prices for assets?
 *   * Use [Get asset prices by IDs](#tag/assets/get/v1/prices/assets)
 *
 * - What if i want real time prices?
 *   * Price in our systems are calculate every 15 seconds. However, if you want real time prices, use [Swapping price](#tag/sdk/get/v1/sdk/{chainId}/markets/{market}/swapping-prices), it return price for PT/YT when swapping with underlying token and vice versa, we don't have real time prices for other assets.
 *
 * - Can i use the SDK to get price, instead of using the `swapping-price` endpoint?
 *   * **Don't use the SDK to get price**, we don't recommend it. SDK endpoints are designed for you to get the calldata for **sending transaction**, not for getting the price. Also, SDK endpoints are very costly and will get rate limited easily if you use it to get price of many tokens.
 *
 * - How to get token names, expiries, etc?
 *   * Use [Get asset metadata by IDs](#tag/assets/get/v1/assets/all)
 *
 * - Do you have historical data, breakdown to minutes?
 *   * No we don't, all historical data is aggregated to hourly/daily/weekly data.
 */
export class PendleApi<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  limitOrders = {
    /**
     * @description This endpoint is for analytics purpose, if you want to analyze the limit orders data, this endpoint return all the orders that have been made, including the ones that have been cancelled or fully filled. The results could be very large, so each time we returns at most 1000 orders, you can use the resumeToken to fetch the next page. To get limit order for filling, use the [Get limit orders to match by YT address​](#tag/limit-orders/get/v1/limit-orders/takers/limit-orders) endpoint!
     *
     * @tags Limit Orders
     * @name GetAllLimitOrders
     * @summary Get all limit orders for analytics
     * @request GET:/v2/limit-orders
     */
    getAllLimitOrders: (
      query?: {
        /** Chain id to filter by, leave blank to fetch all chains. */
        chainId?: number;
        /**
         * Maximum number of results to return. The parameter is capped at 1000.
         * @default 100
         */
        limit?: number;
        /** Maker address to filter orders by */
        maker?: string;
        /** Market address to filter orders by */
        yt?: string;
        /** @format date-time */
        timestamp_start?: string;
        /** @format date-time */
        timestamp_end?: string;
        /** Resume token for pagination */
        resumeToken?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LimitOrdersV2Response, any>({
        path: `/v2/limit-orders`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description This have the same interface and usecase as the endpoint above, but it returns the archived orders When an order is not fillable anymore, we **might** archive it to save storage space, to fetch it, use this endpoint. So to fetch full limit orders in history, using this and the endpoint above. Not all orders are archived, it depends on some conditions.
     *
     * @tags Limit Orders
     * @name GetAllArchivedLimitOrders
     * @summary Get all archived limit orders for analytics
     * @request GET:/v2/limit-orders/archived
     */
    getAllArchivedLimitOrders: (
      query?: {
        /** Chain id to filter by, leave blank to fetch all chains. */
        chainId?: number;
        /**
         * Maximum number of results to return. The parameter is capped at 1000.
         * @default 100
         */
        limit?: number;
        /** Maker address to filter orders by */
        maker?: string;
        /** Market address to filter orders by */
        yt?: string;
        /** @format date-time */
        timestamp_start?: string;
        /** @format date-time */
        timestamp_end?: string;
        /** Resume token for pagination */
        resumeToken?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<LimitOrdersV2Response, any>({
        path: `/v2/limit-orders/archived`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the active and historical limit orders placed by a specific user in a market. Supports richer filtering than the analytics endpoint (e.g. by YT, status, market). A user can have at most 50 open orders per market, so pagination is typically unnecessary here. For full cross-user analytics with cursor-based pagination, use [Get all limit orders](#tag/limit-orders/get/v2/limit-orders) instead.
     *
     * @tags Limit Orders
     * @name GetMakerLimitOrder
     * @summary Get user limit orders in market
     * @request GET:/v1/limit-orders/makers/limit-orders
     */
    getMakerLimitOrder: (
      query: {
        /**
         * Number of results to skip. The parameter is capped at 1000.
         * @default 0
         */
        skip?: number;
        /**
         * Maximum number of results to return. The parameter is capped at 100.
         * @default 10
         */
        limit?: number;
        /** ChainId */
        chainId: number;
        /** Maker's address */
        maker: string;
        /** Order's YT address */
        yt?: string;
        /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
        type?: 0 | 1 | 2 | 3;
        /** isActive=true to get all maker's active orders, isActive=false otherwise and do not set isActive if you want to fetch all maker's orders */
        isActive?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<LimitOrdersResponse, any>({
        path: `/v1/limit-orders/makers/limit-orders`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Submit a signed limit order to the Pendle order book. Once created, the order is visible to takers and will be filled against incoming swaps at or better than the specified implied APY. Before calling this, generate the order payload via [Generate limit order data](#tag/limit-orders/post/v1/limit-orders/makers/generate-limit-order-data), sign it with your wallet, and include the signature in the request body. Common rejection reasons: the YT or market is not whitelisted for limit orders, the order has already expired, or the signature is invalid. To cancel a submitted order, use [Cancel single limit order](#tag/sdk/get/v1/sdk/{chainId}/limit-order/cancel-single) or [Cancel all limit orders](#tag/sdk/get/v1/sdk/{chainId}/limit-order/cancel-all).
     *
     * @tags Limit Orders
     * @name CreateOrder
     * @summary Create limit order
     * @request POST:/v1/limit-orders/makers/limit-orders
     */
    createOrder: (data: CreateLimitOrderDto, params: RequestParams = {}) =>
      this.request<LimitOrderResponse, HttpErrorResponse>({
        path: `/v1/limit-orders/makers/limit-orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Generate the EIP-712 typed data payload for a limit order. Sign the returned data with the maker's private key, then submit the order via [Create limit order](#tag/limit-orders/post/v1/limit-orders/makers/limit-orders). The generated order specifies the YT address, direction (long or short yield), size, and implied APY target. The order remains valid until it is either fully filled, cancelled, or expired.
     *
     * @tags Limit Orders
     * @name GenerateLimitOrderData
     * @summary Generate limit order data for signing
     * @request POST:/v1/limit-orders/makers/generate-limit-order-data
     */
    generateLimitOrderData: (
      data: GenerateLimitOrderDataDto,
      params: RequestParams = {},
    ) =>
      this.request<GenerateLimitOrderDataResponse, HttpErrorResponse>({
        path: `/v1/limit-orders/makers/generate-limit-order-data`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Generate a batch of limit orders spread across a price (implied APY) range for signing. Scaled orders distribute your total size across multiple price levels, providing better market depth than a single large order. Sign each generated order individually, then submit them via [Create limit order](#tag/limit-orders/post/v1/limit-orders/makers/limit-orders). Useful for market-making strategies.
     *
     * @tags Limit Orders
     * @name GenerateScaledLimitOrderData
     * @summary Generate list of limit orders (scaled) for signing
     * @request POST:/v1/limit-orders/makers/generate-scaled-order-data
     */
    generateScaledLimitOrderData: (
      data: GenerateScaledOrderDataDto,
      params: RequestParams = {},
    ) =>
      this.request<GenerateScaledOrderResponse, any>({
        path: `/v1/limit-orders/makers/generate-scaled-order-data`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the best-matching active limit orders for a given YT address, sorted by implied APY for efficient taker fill selection. The response includes full order structs and maker signatures ready to pass directly to the Pendle limit order contract for on-chain settlement. Only active orders (unfilled, uncancelled, unexpired) are returned. For analytics and full order history (including filled/cancelled), use [Get all limit orders](#tag/limit-orders/get/v2/limit-orders) instead.
     *
     * @tags Limit Orders
     * @name GetTakerLimitOrders
     * @summary Get limit orders to match by YT address
     * @request GET:/v1/limit-orders/takers/limit-orders
     */
    getTakerLimitOrders: (
      query: {
        /**
         * Number of results to skip. The parameter is capped at 1000.
         * @default 0
         */
        skip?: number;
        /**
         * Maximum number of results to return. The parameter is capped at 100.
         * @default 10
         */
        limit?: number;
        /** ChainId */
        chainId: number;
        /** Order's YT address */
        yt: string;
        /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
        type: 0 | 1 | 2 | 3;
        sortBy?: "Implied Rate";
        sortOrder?: "asc" | "desc";
      },
      params: RequestParams = {},
    ) =>
      this.request<LimitOrdersTakerResponse, HttpErrorResponse>({
        path: `/v1/limit-orders/takers/limit-orders`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the consolidated order book for a market, aggregating both limit orders and AMM liquidity depth into a unified view. The book is split into two sides: - **longYieldEntries**: available liquidity for buying YT (long yield positions), ordered by ascending implied APY - **shortYieldEntries**: available liquidity for selling YT (short yield positions), ordered by descending implied APY Each entry shows the implied APY price level, combined limit order size, and AMM depth at that level.
     *
     * @tags Limit Orders
     * @name GetLimitOrderBookV2
     * @summary Get order book v2
     * @request GET:/v2/limit-orders/book/{chainId}
     */
    getLimitOrderBookV2: (
      chainId: number,
      query: {
        /**
         * Maximum number of results to return. The parameter is capped at 200.
         * @default 10
         */
        limit?: number;
        /** Min: 0, Max: 3, returned impliedApy will have precision upto 10^{-precisionDecimal}% */
        precisionDecimal: number;
        /** Market address */
        market: string;
        /** Include AMM orders in the order book */
        includeAmm?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<OrderBookV2Response, any>({
        path: `/v2/limit-orders/book/${chainId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  assets = {
    /**
     * @description Returns USD prices for Pendle-supported tokens across all chains. Covers all token types in the Pendle app, including non-Pendle tokens (USDC, WETH, etc.) when they appear as underlying assets. Prices update approximately every minute. Filter by `chainId`, asset `id`, or `type` to narrow results. For real-time PT/YT pre-trade prices that reflect current pool depth, use [Get swapping prices](#tag/sdk/get/v1/sdk/{chainId}/markets/{market}/swapping-prices) instead.
     *
     * @tags Assets
     * @name GetAllAssetPricesByAddressesCrossChains
     * @summary Get asset prices
     * @request GET:/v1/prices/assets
     */
    getAllAssetPricesByAddressesCrossChains: (
      query?: {
        /**
         * Token ids to data for (comma-separated), leave blank to fetch all tokens. Up to 20 ids allowed.
         * @example "1-0x5fe30ac5cb1abb0e44cdffb2916c254aeb368650,1-0xc5cd692e9b4622ab8cdb57c83a0f99f874a169cd"
         */
        ids?: string;
        /**
         * Chain id to filter by, leave blank to fetch all chains.
         * @example 1
         */
        chainId?: number;
        /**
         * Number of results to skip.
         * @default 0
         */
        skip?: number;
        /** Maximum number of results to return. Leave blank to fetch all results. */
        limit?: number;
        /** Asset types to filter by (comma-separated). Valid values: `PENDLE_LP`, `SY`, `PT`, `YT`. Leave blank to fetch all assets types. */
        type?: PendleAssetType;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetAssetPricesCrossChainResponse, any>({
        path: `/v1/prices/assets`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Historical OHLCV data for PT / YT tokens / LP tokens. We do not support data for **SY and non-Pendle tokens**. The data is returned in CSV format with open, high, low, close prices, and volume. In the case of LP, volume data will be 0. To get the correct volume, use our [Get market time-series data by address](#tag/markets/get/v2/{chainId}/markets/{address}/historical-data) endpoint. Returns at most 1440 data points. The cost for the endpoint is based on how many data points are returned. The calculation is: `ceil(number of data points / 300)`. At 1440 data points (which is 2 months of data with an hourly interval, or 4 years with a daily interval), the cost will be 5 computing units.
     *
     * @tags Assets
     * @name OhlcvV4
     * @summary Get historical OHLCV data for a PT, YT, or LP token
     * @request GET:/v4/{chainId}/prices/{address}/ohlcv
     */
    ohlcvV4: (
      chainId: number,
      address: string,
      query?: {
        /**
         * Time interval for OHLCV data aggregation. Valid values: `hour`, `day`, `week`.
         * @default "hour"
         */
        time_frame?: "hour" | "day" | "week";
        /**
         * ISO Date string of the start time you want to query
         * @format date-time
         */
        timestamp_start?: string;
        /**
         * ISO Date string of the end time you want to query
         * @format date-time
         */
        timestamp_end?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<PriceOHLCVCSVResponse, any>({
        path: `/v4/${chainId}/prices/${address}/ohlcv`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the flat list of all PT, YT, LP, and SY tokens supported in the Pendle app, across all chains. Each entry includes: name, symbol, contract address, decimals, expiry timestamp (for PT/YT), and icon URL. Filter by `chainId`, asset `id`, or `type` (pt, yt, lp, sy). Prices are not included — use [Get asset prices](#tag/assets/get/v1/prices/assets) to retrieve them separately.
     *
     * @tags Assets
     * @name GetPendleAssetsMetadata
     * @summary Get all Pendle assets
     * @request GET:/v1/assets/all
     */
    getPendleAssetsMetadata: (
      query?: {
        /**
         * Token ids to data for (comma-separated), leave blank to fetch all tokens. Up to 20 ids allowed.
         * @example "1-0x5fe30ac5cb1abb0e44cdffb2916c254aeb368650,1-0xc5cd692e9b4622ab8cdb57c83a0f99f874a169cd"
         */
        ids?: string;
        /**
         * Chain id to filter by, leave blank to fetch all chains.
         * @example 1
         */
        chainId?: number;
        /**
         * Number of results to skip.
         * @default 0
         */
        skip?: number;
        /** Maximum number of results to return. Leave blank to fetch all results. */
        limit?: number;
        /** Asset types to filter by (comma-separated). Valid values: `PENDLE_LP`, `SY`, `PT`, `YT`. Leave blank to fetch all assets types. */
        type?: PendleAssetType;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetAllAssetsCrossChainResponse, any>({
        path: `/v1/assets/all`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  markets = {
    /**
     * @description Returns a paginated list of whitelisted Pendle markets across all supported chains, including points and external protocol integration data when available. Filter by `chainId`, `isActive`, or `ids` (comma-separated market IDs in `chainId-address` format). This is the recommended starting point for discovering and monitoring Pendle markets across all chains.
     *
     * @tags Markets
     * @name GetAllMarketsV2
     * @summary Get all markets
     * @request GET:/v2/markets/all
     */
    getAllMarketsV2: (
      query?: {
        /**
         * Sort by field: 1 for ascending, -1 for descending
         * @example "name:1"
         */
        order_by?: string;
        /** Filter to active or inactive markets */
        isActive?: boolean;
        /** Filter to markets on a specific blockchain network */
        chainId?: number;
        /**
         * Market ids to fetch metadata for (comma-separated), leave blank to fetch all markets. Up to 20 ids allowed.
         * @example "1-0x7b246b8dbc2a640bf2d8221890cee8327fc23917,1-0x44474d98d1484c26e8d296a43a721998731cf775"
         */
        ids?: string;
        /**
         * Number of results to skip.
         * @default 0
         */
        skip?: number;
        /**
         * Maximum number of results to return. The parameter is capped at 100.
         * @default 20
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetMarketsCrossChainV2Response, any>({
        path: `/v2/markets/all`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the time-series data for a given market. Useful to draw charts or do data analysis. This endpoint supports field selection via the `fields` query parameter. Table below shows the available fields and their descriptions. | Field | Description | |-------|-------------| | timestamp | Timestamp in ISO format| | baseApy | APY including yield, swap fee and Pendle rewards without boosting| | impliedApy | Implied APY of market| | lastEpochVotes | Last epoch votes| | lpPrice | LP price in USD| | lpRewardApy | APY from LP reward tokens| | maxApy | APY when maximum boost is applied| | pendleApy | APY from Pendle rewards| | ptPrice | PT price in USD| | swapFeeApy | Swap fee APY for LP holders, without boosting| | syPrice | SY price in USD| | totalPt | Total PT in the market| | totalSupply | Total supply of the LP token| | totalSy | Total SY in the market| | totalTvl | Market total TVL (including floating PT that are not in the AMM) in USD| | tradingVolume | 24h trading volume in USD| | tvl | Market liquidity (TVL in the pool) in USD| | underlyingApy | APY of the underlying asset| | underlyingInterestApy | Annual percentage yield from the underlying asset interest| | underlyingRewardApy | Annual percentage yield from the underlying asset rewards| | voterApr | APY for voters (vePENDLE holders) from voting on this pool| | ytFloatingApy | Floating APY for YT holders (underlyingApy - impliedApy)| | ytPrice | YT price in USD| Returns at most 1440 data points. The cost for the endpoint is based on how many data points are returned. The calculation is: `ceil(number of data points / 300)`. At 1440 data points (which is 2 months of data with an hourly interval, or 4 years with a daily interval), the cost will be 5 computing units.
     *
     * @tags Markets
     * @name MarketHistoricalDataV2
     * @summary Get market time-series data by address
     * @request GET:/v2/{chainId}/markets/{address}/historical-data
     */
    marketHistoricalDataV2: (
      chainId: number,
      address: string,
      query?: {
        /** @default "hour" */
        time_frame?: "hour" | "day" | "week";
        /** @format date-time */
        timestamp_start?: string;
        /** @format date-time */
        timestamp_end?: string;
        /**
         * Comma-separated list of fields to include in the response. Use `all` to include all fields. Available fields could be found in the table above.
         *
         * Although you could use `all` to include all fields, it is not recommended because the bigger the payload is, the slower the response will be.
         * @default "underlyingApy,impliedApy,maxApy,baseApy,tvl"
         * @example "timestamp,maxApy,baseApy,underlyingApy,impliedApy,tvl,totalTvl,underlyingInterestApy,underlyingRewardApy,ytFloatingApy,swapFeeApy,voterApr,pendleApy,lpRewardApy,totalPt,totalSy,totalSupply,ptPrice,ytPrice,syPrice,lpPrice,lastEpochVotes,tradingVolume"
         */
        fields?: string;
        /**
         * Whether you want to fetch fee breakdown data. Default is false. If enable, the response will include 3 fields: explicitSwapFee, implicitSwapFee, limitOrderFee and computing unit cost will be doubled.
         *
         * Fee breakdown is only available for daily and weekly timeframes.
         */
        includeFeeBreakdown?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<MarketHistoricalDataResponse, any>({
        path: `/v2/${chainId}/markets/${address}/historical-data`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  sdk = {
    /**
     * @description Returns the two sets of tokens relevant for a given market: - **SY input tokens**: tokens accepted by the SY wrapper for minting/redeeming (e.g. USDC for a USDC-based market). - **Zap tokens**: tokens that can be used as input when buying PT/YT or providing liquidity, routed via aggregators. Call this before building a Convert or Swap request to know which input tokens are valid for a given market.
     *
     * @tags SDK
     * @name GetMarketTokens
     * @summary Get supported tokens for market
     * @request GET:/v1/sdk/{chainId}/markets/{market}/tokens
     */
    getMarketTokens: (
      chainId: number,
      market: string,
      params: RequestParams = {},
    ) =>
      this.request<MarketTokensResponse, any>({
        path: `/v1/sdk/${chainId}/markets/${market}/tokens`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the list of DEX aggregators available on this chain for routing token swaps, along with the additional computing unit cost each one adds to SDK requests. Use this to decide which aggregators to include in Convert/Swap calls via the `aggregators` query param. You can reduce any aggregator's CU cost to 0 by providing your own API key in the corresponding request header. See [Reducing Aggregator Costs](https://docs.pendle.finance/pendle-v2/Developers/Backend/HostedSdk#reduce-aggregator-computing-units) for details.
     *
     * @tags SDK
     * @name GetSupportedAggregators
     * @summary Get supported aggregators for a chain
     * @request GET:/v1/sdk/{chainId}/supported-aggregators
     */
    getSupportedAggregators: (chainId: number, params: RequestParams = {}) =>
      this.request<SupportedAggregatorsResponse, any>({
        path: `/v1/sdk/${chainId}/supported-aggregators`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Return price by swapping  1 unit underlying token to PT/ YT, and 1 unit of PT/YT to the underlying token. One unit is defined as 10**decimal. The result is updated every block. Implied APY of the market is also included.
     *
     * @tags SDK
     * @name GetMarketSpotSwappingPrice
     * @summary Get real-time PT/YT swap price of a market
     * @request GET:/v1/sdk/{chainId}/markets/{market}/swapping-prices
     */
    getMarketSpotSwappingPrice: (
      chainId: number,
      market: string,
      params: RequestParams = {},
    ) =>
      this.request<GetSpotSwappingPriceResponse, any>({
        path: `/v1/sdk/${chainId}/markets/${market}/swapping-prices`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Generate the transaction payload to cancel a specific limit order on-chain. Pass the full signed order struct (from the original order creation) to identify which order to cancel. The order becomes invalid once the cancellation transaction is confirmed.
     *
     * @tags SDK
     * @name CancelSingleLimitOrder
     * @summary Cancel one single limit order by order hash
     * @request GET:/v1/sdk/{chainId}/limit-order/cancel-single
     */
    cancelSingleLimitOrder: (
      chainId: number,
      query: {
        /** User Address */
        userAddress: string;
        /** BigInt string of salt */
        salt: string;
        /** BigInt string of expiry */
        expiry: string;
        /** BigInt string of nonce */
        nonce: string;
        /** LimitOrderType { 0 : TOKEN_FOR_PT, 1 : PT_FOR_TOKEN, 2 : TOKEN_FOR_YT, 3 : YT_FOR_TOKEN } */
        orderType: 0 | 1 | 2 | 3;
        /** Token used by user to make order */
        token: string;
        /** YT address */
        YT: string;
        /** Maker address */
        maker: string;
        /** Receiver address */
        receiver: string;
        /** BigInt string of making amount */
        makingAmount: string;
        /** BigInt string of lnImpliedRate (natural logarithm of the implied rate) */
        lnImpliedRate: string;
        /** BigInt string of failSafeRate */
        failSafeRate: string;
        /** Bytes string for permit */
        permit: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SdkResponse, any>({
        path: `/v1/sdk/${chainId}/limit-order/cancel-single`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Generate the transaction payload to cancel all active limit orders for a user in a single on-chain call. This works by incrementing the user's nonce on-chain, which invalidates all previously signed orders at once. More efficient than cancelling orders one by one when clearing all open positions.
     *
     * @tags SDK
     * @name CancelAllLimitOrders
     * @summary Cancel all limit orders
     * @request GET:/v1/sdk/{chainId}/limit-order/cancel-all
     */
    cancelAllLimitOrders: (
      chainId: number,
      query: {
        /** User Address */
        userAddress: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SdkResponse, any>({
        path: `/v1/sdk/${chainId}/limit-order/cancel-all`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Generate a transaction payload to claim all accrued interest and incentive rewards across multiple positions in a single call. Specify which positions to claim from by passing arrays of: - `sys`: SY token addresses (to claim SY interest) - `yts`: YT token addresses (to claim YT interest and rewards) - `markets`: LP market addresses (to claim LP rewards) Useful for portfolio management bots or dashboards that batch-claim on behalf of users.
     *
     * @tags SDK
     * @name RedeemInterestsAndRewards
     * @summary Redeem rewards and interests from positions
     * @request GET:/v1/sdk/{chainId}/redeem-interests-and-rewards
     */
    redeemInterestsAndRewards: (
      chainId: number,
      query: {
        /** The address to receive the output of the action */
        receiver: string;
        /** Use comma separated values to search by multiple addresses */
        sys?: string;
        /** Use comma separated values to search by multiple addresses */
        yts?: string;
        /** Use comma separated values to search by multiple addresses */
        markets?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<RedeemInterestsAndRewardsResponse, any>({
        path: `/v1/sdk/${chainId}/redeem-interests-and-rewards`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description The **Convert API** is the recommended endpoint for all Pendle transaction building. It supersedes the individual swap, add/remove liquidity, mint, redeem, transfer, and exit endpoints — handling 21 distinct operations through a unified interface. The action is automatically detected from your `tokensIn` and `tokensOut` addresses. See the table below for all supported operations. | Action                                                | tokensIn              | tokensOut       | Note                                                                                                                                                                                                                                 | |-------------------------------------------------------|-----------------------|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| | Swap from PT to token (sell PT)                       | [PT]                  | [token]         | Callable regardless of the market's expiry                                                                                                                                                                                           | | Swap from token to PT (buy PT)                        | [token]               | [PT]            | Only callable until the market's expiry                                                                                                                                                                                              | | Swap from YT to token (sell YT)                       | [YT]                  | [token]         | Only callable until the market's expiry                                                                                                                                                                                              | | Swap from token to YT (buy YT)                        | [token]               | [YT]            | Only callable until the market's expiry                                                                                                                                                                                              | | Swap between PT and YT                                | [PT] or [YT]          | [YT] or [PT]    | Only callable until the market's expiry                                                                                                                                                                                              | | Add liquidity dual (using both token and PT)          | [token, PT]           | [LP]            | Only callable until the market's expiry.                                                                                                                                                                                             | | Add liquidity single (using token or PT)              | [token] or [PT]       | [LP]            | Only callable until the market's expiry.                                                                                                                                                                                             | | Add liquidity single ZPI (using token or PT, keep YT) | [token] or [PT]       | [LP, YT]        | Zero-price impact provision is supported where no price impact will incur, and users will receive LP and YT (less LP compared to normal mode). Only callable until the market's expiry.                                              | | Remove liquidity dual (get back both token and PT)    | [LP]                  | [token, PT]     | Callable regardless of the market's expiry                                                                                                                                                                                           | | Remove liquidity single (get back either token or PT) | [LP]                  | [token] or [PT] | Callable regardless of the market's expiry                                                                                                                                                                                           | | Mint PT & YT                                          | [token]               | [PT, YT]        | Only callable until YT's expiry                                                                                                                                                                                                      | | Redeem PT & YT                                        | [PT, YT]              | [token]         | If called before YT's expiry, both PT & YT of equal amounts are needed and will be burned. Else, only PT is needed and will be burned.                                                                                               | | Transfer liquidity between markets                    | [LP, PT, YT]          | [LP]            | tokensIn doesn't need to include all 3 tokens; any number of tokens will work. All provided inputs (LP, PT & YT) will be sold/redeemed to the underlying asset before being zapped into the destination market.                      | | Transfer liquidity ZPI                                | [LP, PT, YT]          | [LP, YT]        | tokensIn doesn't need to include all 3 tokens; any number of tokens will work. All provided inputs (LP, PT & YT) will be sold/redeemed to the underlying asset before being zapped into the destination market with no price impact. | | Mint SY                                               | [token]               | [SY]            |                                                                                                                                                                                                                                      | | Redeem SY                                             | [SY]                  | [token]         |                                                                                                                                                                                                                                      | | Swap PT between markets (Roll over pts)               | [PT]                  | [PT]            | PT is redeemed for the underlying asset and used to buy the new PT.                                                                                                                                                                  | | Exit market                                           | [LP, PT, YT]          | [token]         | tokensIn doesn't need to include all 3 tokens; any number of tokens will work.                                                                                                                                                       | | Swap LP to PT between markets                         | [LP]                  | [PT]            | Only callable until the market's expiry                                                                                                                                                                                              | | Pendle swap (swap multiple ERC20 tokens to 1 token)   | [token1, token2, ...] | [token]         | Support at most 3 tokens in                                                                                                                                                                                                          | `tokensIn` and `tokensOut` are the input and output tokens for the action, should be seperate by comma with no spaces. Example if your action requires 2 tokensIn, you can pass `tokensIn=0x123,0x456` For code examples and migration from individual SDK endpoints, see the [Hosted SDK documentation](https://docs.pendle.finance/pendle-v2/Developers/Backend/HostedSdk#examples). ## Computing cost This API will consume 5 computing units if no aggregator is used, with no additional data. Enabling aggregator will consume additional computing units, each aggregator cost differently, and could be check at: [Get supported aggregators](#tag/sdk/get/v1/sdk/{chainId}/supported-aggregators) Refer to our document for guide to reduce CU usage with aggregators: [Reduce CU Usage](https://docs.pendle.finance/pendle-v2/Developers/Backend/HostedSdk#reduce-aggregator-computing-units-v2-endpoints-only) --- **This is the v3 (POST) variant.** It accepts `inputs` and `outputs` as a JSON request body instead of query parameters — cleaner for multi-token inputs and easier to integrate in typed clients. **Prefer this over v2 (GET) for new integrations.**
     *
     * @tags SDK
     * @name ConvertV3
     * @summary Universal convert function
     * @request POST:/v3/sdk/{chainId}/convert
     */
    convertV3: (
      chainId: number,
      data: ConvertV3Dto,
      params: RequestParams = {},
    ) =>
      this.request<MultiRouteConvertResponse, any>({
        path: `/v3/sdk/${chainId}/convert`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Swap a bridged PT on a spoke chain back to a regular token using the fixed-price PT AMM. This is specifically for **cross-chain PT redemption flows** where PT has been bridged to a non-primary chain. The fixed-price AMM prices PT based on time-to-maturity, independent of pool liquidity. Supports both: - Exact PT input → token output - Exact token output ← PT input (pass the required token amount; the system calculates PT needed) Only valid on supported spoke chains.
     *
     * @tags SDK
     * @name SwapPtCrossChainV2
     * @summary Swap PT using fixed price AMM for cross-chain operations
     * @request GET:/v2/sdk/{chainId}/swap-pt-cross-chain
     */
    swapPtCrossChainV2: (
      chainId: number,
      query: {
        /** Recipient address for transaction output */
        receiver?: string;
        /** Maximum slippage tolerance (0-1, where 0.01 equals 1%) */
        slippage: number;
        /**
         * Enable swap aggregator to swap between tokens that cannot be natively converted from/to the underlying asset
         * @default false
         */
        enableAggregator?: boolean;
        /**
         * List of aggregator names to use for the swap. If not provided, all aggregators will be used.List of supported aggregator can be found at: [getSupportedAggregators](#tag/sdk/get/v1/sdk/{chainId}/supported-aggregators)
         * @example "kyberswap,okx"
         */
        aggregators?: string;
        /** PT token address */
        pt: string;
        /** Exact amount value PT in */
        exactPtIn: string;
        /** Output token address */
        tokenOut: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SwapWithFixedPricePtAmmResponse, any>({
        path: `/v2/sdk/${chainId}/swap-pt-cross-chain`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns metadata for a PT that has been bridged to a spoke chain, including maturity, underlying asset details, and fixed-price AMM parameters. Use this to verify that a bridged PT is supported on the current chain and to fetch its pricing parameters before calling [Swap PT cross-chain](#tag/sdk/get/v2/{chainId}/swap-pt-cross-chain).
     *
     * @tags SDK
     * @name GetPtCrossChainMetadata
     * @summary PT cross-chain metadata
     * @request GET:/v1/sdk/{chainId}/cross-chain-pt-metadata/{pt}
     */
    getPtCrossChainMetadata: (
      chainId: number,
      pt: string,
      params: RequestParams = {},
    ) =>
      this.request<PtCrossChainMetadataResponse, any>({
        path: `/v1/sdk/${chainId}/cross-chain-pt-metadata/${pt}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  transactions = {
    /**
     * @description Return transactions with: user action (long or short yield, add or remove liquidity), valuation, implied apy. **Pagination**: This endpoint supports cursor-based pagination using `resumeToken`. The response includes a `resumeToken` field that can be used in the next request to fetch the next page of results. This is more efficient than using `skip` for large datasets.
     *
     * @tags Transactions
     * @name TransactionsV5
     * @summary Get market transactions by address
     * @request GET:/v5/{chainId}/transactions/{address}
     */
    transactionsV5: (
      chainId: number,
      address: string,
      query?: {
        /** Transaction type to filter by. Valid values: `TRADES`, `LIQUIDITY`. */
        type?: TransactionType;
        /** Minimum transaction value filter in USD */
        minValue?: number;
        /** Address of the transaction executor */
        txOrigin?: string;
        /** Specific transaction action to filter by. Valid values: `LONG_YIELD`, `SHORT_YIELD`, `ADD_LIQUIDITY`, `REMOVE_LIQUIDITY`. */
        action?: TransactionAction;
        /** Resume token for pagination. Use this to continue a previous query. */
        resumeToken?: string;
        /**
         * Maximum number of results to return. The parameter is capped at 1000.
         * @default 10
         */
        limit?: number;
        /**
         * Use `resumeToken` instead.
         * @deprecated
         */
        skip?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<TransactionsV5Response, any>({
        path: `/v5/${chainId}/transactions/${address}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  statistics = {
    /**
     * @description Returns a list of unique wallet addresses that have interacted with a specific token across Pendle markets. Use the optional `chainId` parameter to filter results to a specific chain, or omit it to get users across all chains. Common use cases include: - Token holder analysis - User adoption metrics - Market participation statistics
     *
     * @tags Statistics
     * @name GetDistinctUserFromToken
     * @summary Get distinct users for a specific token
     * @request GET:/v1/statistics/get-distinct-user-from-token
     */
    getDistinctUserFromToken: (
      query: {
        /**
         * Token address to query. Can be any Pendle token (PT, YT, SY, LP). Address will be normalized to lowercase.
         * @example "0x0000000000000000000000000000000000000000"
         */
        token: string;
        /** Optional chain ID to filter results. If provided, returns only users who interacted with the token on the specified chain. If omitted, returns users across all chains where the token exists. */
        chainId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<GetDistinctUsersFromTokenEntity, any>({
        path: `/v1/statistics/get-distinct-user-from-token`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  };
  chains = {
    /**
     * No description
     *
     * @tags Chains
     * @name GetSupportedChainIds
     * @summary Get supported chain IDs
     * @request GET:/v1/chains
     */
    getSupportedChainIds: (params: RequestParams = {}) =>
      this.request<ChainIdsResponse, any>({
        path: `/v1/chains`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  dashboard = {
    /**
     * @description Returns a complete snapshot of a user's Pendle positions across all supported chains, including PT, YT, LP, and SY holdings. For each position the response includes token amounts, USD valuations, and claimable interest/reward amounts. **Caching**: claimable reward amounts are cached for up to 24 hours. For real-time claimable data, read directly from the reward contracts via RPC. Use the `chainId` query parameter to filter results to a specific chain.
     *
     * @tags Dashboard
     * @name GetUserPositions
     * @summary Get user positions by address
     * @request GET:/v1/dashboard/positions/database/{user}
     */
    getUserPositions: (
      user: string,
      query?: {
        /**
         * Minimum USD value threshold to filter positions
         * @example 0.1
         */
        filterUsd?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<UserPositionsCrossChainResponse, any>({
        path: `/v1/dashboard/positions/database/${user}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns both pending (unclaimed) and claimed merkle-distributed rewards for a user. Merkle rewards are off-chain incentive distributions (e.g. partner protocol incentives, Pendle campaigns) that are periodically committed on-chain as a merkle root. Users must actively claim them via the associated merkle contract. Useful for displaying claim history, tracking pending rewards, or verifying that a specific reward distribution has been collected.
     *
     * @tags Dashboard
     * @name GetMerkleRewards
     * @summary Get all merkle rewards for a user
     * @request GET:/v1/dashboard/merkle-rewards/{user}
     */
    getMerkleRewards: (user: string, params: RequestParams = {}) =>
      this.request<MerkleRewardsResponse, any>({
        path: `/v1/dashboard/merkle-rewards/${user}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  pnL = {
    /**
     * @description Returns per-transaction PnL data for a user across all Pendle markets and chains. Each transaction includes cost basis, profit/loss, token prices at time of execution, and PT exchange rates. Results are paginated. Use the `resumeToken` from the response to fetch the next page. Data may lag chain tip by a few minutes due to indexing.
     *
     * @tags PnL
     * @name GetTransactions
     * @summary Get user transactions PnL
     * @request GET:/v1/pnl/transactions
     */
    getTransactions: (
      query: {
        /**
         * Number of results to skip. The parameter is capped at 1000.
         * @default 0
         */
        skip?: number;
        /**
         * Maximum number of results to return. The parameter is capped at 1000.
         * @default 10
         */
        limit?: number;
        /** Chain ID */
        chainId?: number;
        user: string;
        /** Market address */
        market?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<TransactionsResponseEntity, any>({
        path: `/v1/pnl/transactions`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the gained PnL for all positions of a user across all chains. Includes net gain, total spent, max capital, trading volume, and unclaimed rewards per market position.
     *
     * @tags PnL
     * @name GetUserGainedPnlPositionsAllChains
     * @summary Get user gained PnL all chains
     * @request GET:/v1/pnl/gained/{user}/positions
     */
    getUserGainedPnlPositionsAllChains: (
      user: string,
      params: RequestParams = {},
    ) =>
      this.request<UserGainedPnlPositionsResponseEntity, any>({
        path: `/v1/pnl/gained/${user}/positions`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  sPendle = {
    /**
     * @description Returns aggregate sPENDLE staking statistics including total PENDLE staked, historical APRs, revenues, fees, and airdrop breakdowns. Historical data covers the last 12 epochs, combining sPENDLE and legacy vePENDLE data.
     *
     * @tags sPENDLE
     * @name SpendleData
     * @summary Get sPENDLE staking data
     * @request GET:/v1/spendle/data
     */
    spendleData: (params: RequestParams = {}) =>
      this.request<GetSpendleStaticDataResponse, any>({
        path: `/v1/spendle/data`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Returns the claimable and historical rewards for a specific sPENDLE holder, including ETH fee rewards, multi-token merkle proofs for claiming, and all-time reward totals.
     *
     * @tags sPENDLE
     * @name GetSpendleReward
     * @summary Get user sPENDLE rewards
     * @request GET:/v1/spendle/{address}
     */
    getSpendleReward: (address: string, params: RequestParams = {}) =>
      this.request<GetSPendleRewardResponse, any>({
        path: `/v1/spendle/${address}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  pendleEmission = {
    /**
     * @description Returns the latest confirmed PENDLE emission across all eligible markets. Each market includes a breakdown of emission by TVL, fee, discretionary, and co-bribing components.
     *
     * @tags Pendle Emission
     * @name PendleEmission
     * @summary Get Pendle Emission
     * @request GET:/v1/pendle-emission
     */
    pendleEmission: (params: RequestParams = {}) =>
      this.request<GetPendleEmissionResponse, any>({
        path: `/v1/pendle-emission`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
}
