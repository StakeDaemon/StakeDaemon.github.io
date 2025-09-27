require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize bot and Supabase
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Session object for tracking temporary states
const session = {};

// Coins and APY
const stableCoins = ['USDT-ERC20', 'USDT-BEP20', 'USDT-TRC20', 'USDC', 'TETHERGOLD', 'XAUT'];
const normalCoins = ['ETH', 'BNB', 'SOL', 'TRX', 'TON', 'SHIBA', 'PEPE'];

const apy = {
  stable: { weekly: 18, monthly: 19, quarterly: 20, semiannual: 21, annual: 23 },
  normal: { weekly: 12, monthly: 13, quarterly: 14, semiannual: 15, annual: 17 }
};

// Minimum withdrawal
const minWithdraw = {
  ETH: 0.015, BNB: 0.15, SOL: 0.3, TRX: 150, TON: 15,
  'USDT-ERC20': 35, 'USDT-BEP20': 35, 'USDT-TRC20': 35, USDC: 35,
  TETHERGOLD: 0.02, XAUT: 0.02, SHIBA: 3000000, PEPE: 3000000
};

// Wallet addresses
const wallets = {
  ETH: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  BNB: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  SOL: 'FWJ6PyjU5DbeVmJ5wSZ94AzkepJkQ1F3zb1U5hLSmt7U',
  TRX: 'TG1PBZq5i6x3dtsa3mvm9sgMpjDjJJpnnh',
  TON: 'UQDzvQCzFDazTMOg3IP9j1kQQahDt2BK_j5_ByZUSEnYwm8_',
  'USDT-ERC20': '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  'USDT-BEP20': '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  'USDT-TRC20': 'TG1PBZq5i6x3dtsa3mvm9sgMpjDjJJpnnh',
  USDC: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  TETHERGOLD: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  XAUT: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  SHIBA: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E',
  PEPE: '0xF331Eb2c66C6515eA029674bD0fF478343c6fe2E'
};

const tonMemo = 'F4A2857B34A392FE9F60';

/* ---------------------- Deposit Verification ---------------------- */
const verifyDeposit = async ({ coin, wallet, amount }) => {
  try {
    switch (coin) {
      case 'ETH':
      case 'USDT-ERC20':
      case 'SHIBA':
      case 'PEPE':
        return verifyEtherscan(wallet, amount);
      case 'BNB':
      case 'USDT-BEP20':
        return verifyBscscan(wallet, amount);
      case 'SOL':
        return verifySolscan(wallet, amount);
      case 'TRX':
      case 'USDT-TRC20':
        return verifyTrongrid(wallet, amount);
      case 'TON':
        return verifyToncenter(wallet, amount);
      default:
        return false;
    }
  } catch (e) {
    console.error('Deposit verification error:', e.message);
    return false;
  }
};

const verifyEtherscan = async (wallet, amount) => {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${wallet}&apikey=${process.env.ETHERSCAN_API_KEY}`;
  const res = await axios.get(url);
  const txs = res.data.result;
  return txs.find(tx => tx.to.toLowerCase() === wallet.toLowerCase() && parseFloat(tx.value) / 1e18 >= amount);
};

const verifyBscscan = async (wallet, amount) => {
  const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${wallet}&apikey=${process.env.BSCSCAN_API_KEY}`;
  const res = await axios.get(url);
  const txs = res.data.result;
  return txs.find(tx => tx.to.toLowerCase() === wallet.toLowerCase() && parseFloat(tx.value) / 1e18 >= amount);
};

const verifySolscan = async (wallet, amount) => {
  const url = `https://public-api.solscan.io/account/${wallet}/transactions?limit=10`;
  const res = await axios.get(url);
  const txs = res.data;
  return txs.find(tx => tx.parsedInstruction?.some(i => i.parsed?.info?.destination === wallet && parseFloat(i.parsed?.info?.lamports || 0) / 1e9 >= amount));
};

const verifyTrongrid = async (wallet, amount) => {
  const url = `https://api.trongrid.io/v1/accounts/${wallet}/transactions`;
  const res = await axios.get(url);
  const txs = res.data.data;
  return txs.find(tx => tx.to_address === wallet && parseFloat(tx.amount) / 1e6 >= amount);
};

const verifyToncenter = async (wallet, amount) => {
  const url = `https://toncenter.com/api/v2/getTransactions?address=${wallet}&limit=10&api_key=${process.env.TONCENTER_API_KEY}`;
  const res = await axios.get(url);
  const txs = res.data.transactions;
  return txs.find(tx => tx.in_msg?.destination === wallet && parseFloat(tx.in_msg?.value || 0) / 1e9 >= amount);
};

/* ---------------------- Bot Start ---------------------- */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await supabase.from('users').upsert({ telegram_id: chatId });
  bot.sendMessage(chatId, `Welcome to StakeDaemon 🧿`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'STAKE', callback_data: 'stake' }],
        [{ text: 'DEPOSIT', callback_data: 'deposit' }],
        [{ text: 'VERIFY DEPOSIT', callback_data: 'verifydeposit' }],
        [{ text: 'WITHDRAW', callback_data: 'withdraw' }],
        [{ text: 'STATS', callback_data: 'stats' }],
        [{ text: 'ABOUT', callback_data: 'about' }]
      ]
    }
  });
});

/* ---------------------- Callback Queries ---------------------- */
bot.on('callback_query', async ({ data, message }) => {
  const chatId = message.chat.id;

  if (data === 'stake') {
    return bot.editMessageText('Choose your plan type:', {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'STABLECOINS', callback_data: 'stake_stable' }],
          [{ text: 'NORMAL', callback_data: 'stake_normal' }]
        ]
      }
    });
  }

  if (data === 'stake_stable' || data === 'stake_normal') {
    const coins = data === 'stake_stable' ? stableCoins : normalCoins;
    const buttons = coins.map(c => [{ text: c, callback_data: `choose_${c}` }]);
    return bot.editMessageText('Select coin:', {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: { inline_keyboard: buttons }
    });
  }

  if (data.startsWith('choose_')) {
    const coin = data.split('_')[1];
    session[chatId] = { coin };
    const durations = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];
    const buttons = durations.map(d => [{
      text: `${d.toUpperCase()} (${apy[stableCoins.includes(coin) ? 'stable' : 'normal'][d]}% APY)`,
      callback_data: `plan_${coin}_${d}`
    }]);
    return bot.editMessageText(`Choose plan for ${coin}:`, {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: { inline_keyboard: buttons }
    });
  }

  if (data.startsWith('plan_')) {
    const [_, coin, duration] = data.split('_');
    session[chatId] = { coin, duration };
    return bot.sendMessage(chatId, `Enter amount to stake for ${coin} (${duration})`);
  }

  if (data === 'deposit') {
    const buttons = Object.keys(wallets).map(c => [{ text: c, callback_data: `deposit_${c}` }]);
    return bot.editMessageText('Select coin to deposit:', {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: { inline_keyboard: buttons }
    });
  }

  if (data.startsWith('deposit_')) {
    const coin = data.split('_')[1];
    session[chatId] = { coin };
    const address = wallets[coin];
    const memoText = coin === 'TON' ? `\nMemo: ${tonMemo}` : '';
    return bot.sendMessage(chatId, `Deposit ${coin} to:\n\n${address}${memoText}\n\nOnce done, tap VERIFY DEPOSIT.`);
  }

  if (data === 'verifydeposit') {
    return bot.sendMessage(chatId, 'Enter deposit details in this format:\n`COIN AMOUNT TXID`\nExample:\n`ETH 0.05 0xabc123...`', { parse_mode: 'Markdown' });
  }

  if (data === 'withdraw') {
    const buttons = Object.keys(minWithdraw).map(c => [{ text: c, callback_data: `withdraw_${c}` }]);
    return bot.editMessageText('Select coin to withdraw:', {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: { inline_keyboard: buttons }
    });
  }

  if (data.startsWith('withdraw_')) {
    const coin = data.split('_')[1];
    session[chatId] = { coin };
    return bot.sendMessage(chatId, `Enter amount to withdraw for ${coin}`);
  }

  if (data === 'stats') {
    const { data: user } = await supabase.from('users').select().eq('telegram_id', chatId).single();
    const deposit = user?.deposit_balance || {};
    const withdrawable = user?.withdrawable_balance || {};
    return bot.sendMessage(chatId, `📊 Your Stats:\nDeposit Balance:\n${JSON.stringify(deposit, null, 2)}\n\nWithdrawable Balance:\n${JSON.stringify(withdrawable, null, 2)}`);
  }

  if (data === 'about') {
    const lines = Object.entries(minWithdraw).map(([c, v]) => `${c}: ${v}`);
    return bot.sendMessage(chatId, `📜 Terms & Conditions: https://example.com/terms\nPrivacy Policy: https://example.com/privacy\n\nMin Withdrawal:\n${lines.join('\n')}\n\nTON Memo: ${tonMemo}`);
  }
});

/* ---------------------- Message Handler ---------------------- */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const state = session[chatId];
  if (!state) return;

  // Staking amount entry
  if (state.coin && state.duration && !state.amount) {
    state.amount = parseFloat(msg.text);
    if (isNaN(state.amount) || state.amount <= 0) {
      return bot.sendMessage(chatId, '❌ Enter a valid numeric amount.');
    }

    const planType = stableCoins.includes(state.coin) ? 'stable' : 'normal';
    const apyValue = apy[planType][state.duration];
    const endDate = new Date();
    const durations = { weekly: 7, monthly: 30, quarterly: 90, semiannual: 180, annual: 365 };
    endDate.setDate(endDate.getDate() + durations[state.duration]);

    // Fetch user
    const { data: user } = await supabase.from('users').select('id, deposit_balance, withdrawable_balance').eq('telegram_id', chatId).single();

    // Check deposit balance
    const depositBalance = user.deposit_balance || {};
    if ((depositBalance[state.coin] || 0) < state.amount) {
      return bot.sendMessage(chatId, `❌ Insufficient deposit balance for ${state.coin}. Deposit more to stake.`);
    }

    // Reduce deposit balance
    depositBalance[state.coin] -= state.amount;
    await supabase.from('users').update({ deposit_balance: depositBalance }).eq('id', user.id);

    // Add staking plan
    await supabase.from('staking_plans').insert({
      user_id: user.id,
      coin: state.coin,
      plan_type: planType,
      duration: state.duration,
      apy: apyValue,
      amount: state.amount,
      end_date: endDate.toISOString(),
      status: 'active'
    });

    bot.sendMessage(chatId, `✅ You staked ${state.amount} ${state.coin} for ${state.duration} at ${apyValue}% APY.\nPlan ends on ${endDate.toDateString()}`);
    delete session[chatId];
    return;
  }

  // Withdrawal amount entry
  if (state.coin && !state.amount) {
    state.amount = parseFloat(msg.text);
    if (isNaN(state.amount) || state.amount <= 0) {
      return bot.sendMessage(chatId, '❌ Enter a valid numeric amount.');
    }
    return bot.sendMessage(chatId, `Enter your wallet address for ${state.coin}`);
  }

  // Withdrawal address entry
  if (state.coin && state.amount && !state.address) {
    state.address = msg.text;
    const min = minWithdraw[state.coin];
    if (state.amount < min) {
      bot.sendMessage(chatId, `❌ Minimum withdrawal for ${state.coin} is ${min}`);
      delete session[chatId];
      return;
    }

    const { data: user } = await supabase.from('users').select('id, withdrawable_balance').eq('telegram_id', chatId).single();
    const withdrawable = user.withdrawable_balance || {};
    if ((withdrawable[state.coin] || 0) < state.amount) {
      bot.sendMessage(chatId, `❌ Insufficient withdrawable balance for ${state.coin}.`);
      delete session[chatId];
      return;
    }

    // Deduct from withdrawable balance
    withdrawable[state.coin] -= state.amount;
    await supabase.from('users').update({ withdrawable_balance: withdrawable }).eq('id', user.id);

    // Log withdrawal request
    await supabase.from('withdraw_requests').insert({
      user_id: user.id,
      coin: state.coin,
      amount: state.amount,
      wallet_address: state.address
    });

    bot.sendMessage(chatId, `🧾 Withdrawal Request Sent:\nCoin: ${state.coin}\nAmount: ${state.amount}\nWallet: ${state.address}`);
    delete session[chatId];
    return;
  }

  // Deposit verification entry
  if (!state.coin && msg.text.includes(' ')) {
    const [coin, amountStr, txid] = msg.text.trim().split(/\s+/);
    const amount = parseFloat(amountStr);
    const wallet = wallets[coin];
    if (!wallet || !amount || !txid) {
      return bot.sendMessage(chatId, '❌ Invalid format. Use: `COIN AMOUNT TXID`', { parse_mode: 'Markdown' });
    }

    const { data: user } = await supabase.from('users').select('id, deposit_balance').eq('telegram_id', chatId).single();
    const { data: existingTx } = await supabase.from('deposit_logs').select('id').eq('tx_hash', txid).single();

    if (existingTx) return bot.sendMessage(chatId, '❌ Invalid TxID or already used.');

    const tx = await verifyDeposit({ coin, wallet, amount });
    if (!tx) return bot.sendMessage(chatId, '❌ Transaction not found or amount mismatch.');

    // Insert deposit log
    await supabase.from('deposit_logs').insert({
      user_id: user.id,
      coin,
      amount,
      tx_hash: txid,
      credited: true
    });

    // Update deposit balance
    const current = user.deposit_balance || {};
    const updated = { ...current, [coin]: (parseFloat(current[coin]) || 0) + amount };
    await supabase.from('users').update({ deposit_balance: updated }).eq('id', user.id);

    bot.sendMessage(chatId, `✅ Deposit Verified:\n${amount} ${coin} credited to your deposit balance.`);
  }
});

/* ---------------------- Process Expired Stakes ---------------------- */
const processExpiredStakes = async () => {
  const now = new Date().toISOString();
  const { data: plans } = await supabase.from('staking_plans').select('*').eq('status', 'active').lte('end_date', now);

  for (const plan of plans) {
    const durationDays = { weekly: 7, monthly: 30, quarterly: 90, semiannual: 180, annual: 365 }[plan.duration];
    const reward = plan.amount * (plan.apy / 100) * (durationDays / 365);

    const { data: user } = await supabase.from('users').select('withdrawable_balance').eq('id', plan.user_id).single();
    const current = user?.withdrawable_balance || {};
    const updated = { ...current, [plan.coin]: (parseFloat(current[plan.coin]) || 0) + reward };

    await supabase.from('users').update({ withdrawable_balance: updated }).eq('id', plan.user_id);
    await supabase.from('staking_plans').update({ status: 'expired', reward_paid: reward }).eq('id', plan.id);
  }
};

// Run every 6 hours
setInterval(processExpiredStakes, 6 * 60 * 60 * 1000);
