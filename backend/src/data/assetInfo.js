/**
 * Asset metadata for all 20 supported symbols.
 * Includes display name, category, description, pip values, and typical spreads.
 */

const CATEGORIES = {
  FOREX: 'Forex',
  CRYPTO: 'Crypto',
  INDICES: 'Indices',
  COMMODITIES: 'Commodities',
};

/**
 * @typedef {Object} AssetInfo
 * @property {string} symbol
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {number} pipValue - Value of 1 pip in the quote currency per standard lot
 * @property {number} pipSize - Price movement equal to 1 pip (e.g. 0.0001 for EURUSD)
 * @property {number} typicalSpread - Typical bid/ask spread in pips
 * @property {string} quoteAsset - The quote/settlement currency
 * @property {string} sessionNote - Notes on when this asset is most liquid
 * @property {number} minLotSize
 * @property {number} maxLeverage - Common retail maximum leverage
 */

const assetInfo = {
  // ------------------------------------------------------------------ Forex
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: CATEGORIES.FOREX,
    description:
      'The most traded currency pair in the world, representing the exchange rate between the Euro and the US Dollar. ' +
      'It accounts for roughly 24% of daily forex volume and is heavily influenced by ECB and Fed monetary policy.',
    pipValue: 10,
    pipSize: 0.0001,
    typicalSpread: 0.6,
    quoteAsset: 'USD',
    sessionNote: 'Most liquid during the London and New York overlap (13:00â€“17:00 UTC).',
    minLotSize: 0.01,
    maxLeverage: 30,
  },

  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: CATEGORIES.FOREX,
    description:
      'Also known as "Cable", GBPUSD is one of the oldest and most volatile major currency pairs. ' +
      'It is sensitive to UK economic data, Bank of England decisions, and geopolitical events.',
    pipValue: 10,
    pipSize: 0.0001,
    typicalSpread: 0.9,
    quoteAsset: 'USD',
    sessionNote: 'Most active during the London session (08:00â€“17:00 UTC).',
    minLotSize: 0.01,
    maxLeverage: 30,
  },

  USDJPY: {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: CATEGORIES.FOREX,
    description:
      'USDJPY is a major safe-haven pair that reflects risk sentiment globally. ' +
      'Often moves inversely to risk-off conditions. The Bank of Japan\'s yield curve control policy has been a key driver.',
    pipValue: 6.7,
    pipSize: 0.01,
    typicalSpread: 0.7,
    quoteAsset: 'JPY',
    sessionNote: 'Most liquid during the Tokyo (00:00â€“09:00 UTC) and New York sessions.',
    minLotSize: 0.01,
    maxLeverage: 30,
  },

  AUDUSD: {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    category: CATEGORIES.FOREX,
    description:
      'Known as the "Aussie", AUDUSD is a commodity-linked currency heavily influenced by iron ore, coal prices, ' +
      'and China\'s economic health. Sensitive to RBA interest rate decisions.',
    pipValue: 10,
    pipSize: 0.0001,
    typicalSpread: 0.8,
    quoteAsset: 'USD',
    sessionNote: 'Most active during the Sydney and Tokyo sessions (22:00â€“09:00 UTC).',
    minLotSize: 0.01,
    maxLeverage: 30,
  },

  USDCAD: {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    category: CATEGORIES.FOREX,
    description:
      'Also called the "Loonie", USDCAD is strongly correlated with crude oil prices due to Canada\'s oil exports. ' +
      'Moves on Bank of Canada and Federal Reserve policy divergence.',
    pipValue: 7.4,
    pipSize: 0.0001,
    typicalSpread: 1.0,
    quoteAsset: 'CAD',
    sessionNote: 'Most active during the New York session (13:00â€“21:00 UTC).',
    minLotSize: 0.01,
    maxLeverage: 30,
  },

  // ------------------------------------------------------------------ Crypto
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: CATEGORIES.CRYPTO,
    description:
      'Bitcoin is the original and largest cryptocurrency by market capitalisation. ' +
      'Known for high volatility and 24/7 trading. Price is influenced by macro sentiment, ETF flows, halving cycles, and institutional adoption.',
    pipValue: 1,
    pipSize: 1,
    typicalSpread: 10,
    quoteAsset: 'USD',
    sessionNote: 'Trades 24/7. Most volatile during US and Asian market hours.',
    minLotSize: 0.001,
    maxLeverage: 10,
  },

  ETHUSD: {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: CATEGORIES.CRYPTO,
    description:
      'Ethereum is the leading smart contract platform and the second largest cryptocurrency. ' +
      'Price is influenced by DeFi and NFT activity, network upgrades, and staking yields.',
    pipValue: 1,
    pipSize: 0.01,
    typicalSpread: 2,
    quoteAsset: 'USD',
    sessionNote: 'Trades 24/7. Often follows Bitcoin\'s lead with higher beta.',
    minLotSize: 0.01,
    maxLeverage: 10,
  },

  BNBUSD: {
    symbol: 'BNBUSD',
    name: 'BNB / US Dollar',
    category: CATEGORIES.CRYPTO,
    description:
      'BNB is the native token of the BNB Chain (formerly Binance Smart Chain) ecosystem. ' +
      'Its price is tied to Binance exchange activity, quarterly token burns, and overall crypto market sentiment.',
    pipValue: 1,
    pipSize: 0.01,
    typicalSpread: 0.5,
    quoteAsset: 'USD',
    sessionNote: 'Trades 24/7. Particularly active during Asian trading hours.',
    minLotSize: 0.01,
    maxLeverage: 10,
  },

  SOLUSD: {
    symbol: 'SOLUSD',
    name: 'Solana / US Dollar',
    category: CATEGORIES.CRYPTO,
    description:
      'Solana is a high-throughput Layer 1 blockchain known for low transaction fees. ' +
      'Its token SOL is used for network fees and staking. Price is sensitive to ecosystem development and NFT/DeFi volume.',
    pipValue: 1,
    pipSize: 0.01,
    typicalSpread: 0.3,
    quoteAsset: 'USD',
    sessionNote: 'Trades 24/7. High volatility asset with strong correlation to ETH.',
    minLotSize: 0.1,
    maxLeverage: 10,
  },

  XRPUSD: {
    symbol: 'XRPUSD',
    name: 'XRP / US Dollar',
    category: CATEGORIES.CRYPTO,
    description:
      'XRP is the native token of the XRP Ledger, designed for fast cross-border payments. ' +
      'Its price history has been significantly influenced by Ripple Labs\' ongoing legal matters and partnerships.',
    pipValue: 1,
    pipSize: 0.0001,
    typicalSpread: 0.0005,
    quoteAsset: 'USD',
    sessionNote: 'Trades 24/7. Can exhibit sharp moves on news related to Ripple.',
    minLotSize: 1,
    maxLeverage: 10,
  },

  // ------------------------------------------------------------------ Indices
  SPX500: {
    symbol: 'SPX500',
    name: 'S&P 500 Index',
    category: CATEGORIES.INDICES,
    description:
      'The S&P 500 tracks the performance of 500 of the largest US publicly listed companies. ' +
      'It is the most widely followed equity index globally and is a key gauge of US economic health.',
    pipValue: 1,
    pipSize: 0.1,
    typicalSpread: 0.4,
    quoteAsset: 'USD',
    sessionNote: 'Most active during NYSE hours (13:30â€“20:00 UTC). Volatile around US economic data.',
    minLotSize: 0.1,
    maxLeverage: 20,
  },

  NAS100: {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    category: CATEGORIES.INDICES,
    description:
      'The Nasdaq 100 includes 100 of the largest non-financial companies on the Nasdaq exchange, ' +
      'heavily weighted toward technology and growth stocks. Sensitive to Fed rate expectations and tech earnings.',
    pipValue: 1,
    pipSize: 0.1,
    typicalSpread: 0.8,
    quoteAsset: 'USD',
    sessionNote: 'Most active during Nasdaq hours (13:30â€“20:00 UTC).',
    minLotSize: 0.1,
    maxLeverage: 20,
  },

  DOW30: {
    symbol: 'DOW30',
    name: 'Dow Jones Industrial Average',
    category: CATEGORIES.INDICES,
    description:
      'The DJIA is a price-weighted index of 30 prominent US companies and one of the oldest stock market indices. ' +
      'It is considered a barometer of broader US economic conditions.',
    pipValue: 1,
    pipSize: 1,
    typicalSpread: 1.5,
    quoteAsset: 'USD',
    sessionNote: 'Most active during NYSE hours (13:30â€“20:00 UTC).',
    minLotSize: 0.1,
    maxLeverage: 20,
  },

  FTSE100: {
    symbol: 'FTSE100',
    name: 'FTSE 100 Index',
    category: CATEGORIES.INDICES,
    description:
      'The FTSE 100 tracks the 100 largest companies listed on the London Stock Exchange by market cap. ' +
      'It has significant exposure to mining, financials, and energy sectors.',
    pipValue: 1,
    pipSize: 0.1,
    typicalSpread: 1.0,
    quoteAsset: 'GBP',
    sessionNote: 'Most active during the London session (08:00â€“16:30 UTC).',
    minLotSize: 0.1,
    maxLeverage: 20,
  },

  DAX40: {
    symbol: 'DAX40',
    name: 'DAX 40 Index',
    category: CATEGORIES.INDICES,
    description:
      'The DAX 40 represents the 40 largest German companies on the Frankfurt Stock Exchange. ' +
      'Heavily weighted toward industrials, automotive, and chemicals. Sensitive to global trade conditions.',
    pipValue: 1,
    pipSize: 0.1,
    typicalSpread: 0.9,
    quoteAsset: 'EUR',
    sessionNote: 'Most active during the Frankfurt session (07:00â€“17:30 UTC).',
    minLotSize: 0.1,
    maxLeverage: 20,
  },

  // ------------------------------------------------------------------ Commodities
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    category: CATEGORIES.COMMODITIES,
    description:
      'Gold is a traditional safe-haven asset and inflation hedge. ' +
      'Its price moves inversely to real US interest rates and the US Dollar index. ' +
      'Central bank buying and geopolitical risk are key demand drivers.',
    pipValue: 1,
    pipSize: 0.01,
    typicalSpread: 0.35,
    quoteAsset: 'USD',
    sessionNote: 'Most active during London and New York overlap (13:00â€“17:00 UTC).',
    minLotSize: 0.01,
    maxLeverage: 20,
  },

  XAGUSD: {
    symbol: 'XAGUSD',
    name: 'Silver / US Dollar',
    category: CATEGORIES.COMMODITIES,
    description:
      'Silver has both monetary and industrial applications, making it more volatile than gold. ' +
      'It is used extensively in solar panels and electronics. Price often amplifies gold\'s moves.',
    pipValue: 5,
    pipSize: 0.001,
    typicalSpread: 0.03,
    quoteAsset: 'USD',
    sessionNote: 'Follows gold session hours. Higher volatility than gold.',
    minLotSize: 0.1,
    maxLeverage: 20,
  },

  USOIL: {
    symbol: 'USOIL',
    name: 'US Crude Oil (WTI)',
    category: CATEGORIES.COMMODITIES,
    description:
      'West Texas Intermediate (WTI) crude oil is the primary US oil benchmark. ' +
      'Price is driven by OPEC+ supply decisions, US inventory data (EIA weekly reports), and global demand forecasts.',
    pipValue: 1,
    pipSize: 0.01,
    typicalSpread: 0.03,
    quoteAsset: 'USD',
    sessionNote: 'Most active during New York hours. Sharp moves on EIA inventory data (Wednesdays 14:30 UTC).',
    minLotSize: 0.1,
    maxLeverage: 10,
  },

  UKOIL: {
    symbol: 'UKOIL',
    name: 'UK Crude Oil (Brent)',
    category: CATEGORIES.COMMODITIES,
    description:
      'Brent crude is the international oil pricing benchmark, sourced from the North Sea. ' +
      'It typically trades at a slight premium to WTI and is used to price roughly two-thirds of the world\'s traded oil.',
    pipValue: 1,
    pipSize: 0.01,
    typicalSpread: 0.04,
    quoteAsset: 'USD',
    sessionNote: 'Active during London and New York sessions. Reacts strongly to OPEC news.',
    minLotSize: 0.1,
    maxLeverage: 10,
  },

  NATGAS: {
    symbol: 'NATGAS',
    name: 'Natural Gas (Henry Hub)',
    category: CATEGORIES.COMMODITIES,
    description:
      'US Natural Gas futures (Henry Hub) are among the most volatile commodity markets. ' +
      'Price is strongly influenced by weather forecasts (heating/cooling demand), EIA storage reports, and seasonal patterns.',
    pipValue: 1,
    pipSize: 0.001,
    typicalSpread: 0.003,
    quoteAsset: 'USD',
    sessionNote: 'Highly seasonal. Volatile around EIA storage reports (Thursdays 14:30 UTC).',
    minLotSize: 0.1,
    maxLeverage: 10,
  },
};

/**
 * Get metadata for a specific symbol.
 * @param {string} symbol
 * @returns {AssetInfo|null}
 */
function getAssetInfo(symbol) {
  return assetInfo[symbol.toUpperCase()] || null;
}

/**
 * Get all symbols grouped by category.
 * @returns {Object}
 */
function getSymbolsByCategory() {
  const grouped = {};
  for (const info of Object.values(assetInfo)) {
    if (!grouped[info.category]) grouped[info.category] = [];
    grouped[info.category].push(info.symbol);
  }
  return grouped;
}

/**
 * Get all asset metadata as an array.
 * @returns {AssetInfo[]}
 */
function getAllAssets() {
  return Object.values(assetInfo);
}

module.exports = {
  assetInfo,
  getAssetInfo,
  getSymbolsByCategory,
  getAllAssets,
  CATEGORIES,
};
