module.exports = {
  // Minimum deposits
  minDeposit: {
    ETH: 0.015,
    BSC: 0.15,
    SOL: 0.3,
    TRX: 150,
    TON: 15,
    USDT_ERC20: 35,
    USDT_BEP20: 35,
    USDT_TRC20: 35,
    USDC: 35,
    TETHERGOLD: 0.02,
    SHIBA: 3000000,
    PEPE: 3000000
  },

  // Wallet addresses
  wallets: {
    ETH: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    BSC: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    SOL: "FWJ6PyjU5DbeVmJ5wSZ94AzkepJkQ1F3zb1U5hLSmt7U",
    TRX: "TG1PBZq5i6x3dtsa3mvm9sgMpjDjJJpnnh",
    TON: {
      address: "UQDzvQCzFDazTMOg3IP9j1kQQahDt2BK_j5_ByZUSEnYwm8_",
      memo: "F4A2857B34A392FE9F60"
    },
    USDT_ERC20: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    USDT_BEP20: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    USDT_TRC20: "TG1PBZq5i6x3dtsa3mvm9sgMpjDjJJpnnh",
    USDC: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    TETHERGOLD: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    SHIBA: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E",
    PEPE: "0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E"
  },

  // APY Plans
  plans: {
    normal: {
      weekly: 0.18,
      monthly: 0.19,
      quarterly: 0.20,
      semiannual: 0.21,
      annual: 0.23
    },
    stablecoin: {
      weekly: 0.12,
      monthly: 0.13,
      quarterly: 0.14,
      semiannual: 0.15,
      annual: 0.17
    }
  },

  // Auto-detected coins
  autoDepositCoins: [
    "ETH",
    "BSC",
    "SOL",
    "TRX",
    "TON",
    "USDT_ERC20",
    "USDT_BEP20",
    "USDT_TRC20",
    "USDC",
    "TETHERGOLD",
    "SHIBA",
    "PEPE"
  ],

  // Manual coins
  manualCoins: ["BTC", "DOGE", "LTC", "BCH", "ADA", "AVAX", "LINK", "POLYGON"]
};
