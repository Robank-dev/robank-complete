import { config } from '../config.js';

export function getOnrampUrl(walletAddress, amount) {
  if (!config.moonpayApiKey) {
    throw new Error('MOONPAY_API_KEY is not configured yet. Add it to backend/.env.');
  }

  // MoonPay production signing/URL construction depends on your approved business account.
  // Keep this behind one service so the frontend never handles the secret key.
  const url = new URL('https://buy.moonpay.com/');
  url.searchParams.set('walletAddress', walletAddress);
  url.searchParams.set('currencyCode', 'usdc_base');
  if (amount) url.searchParams.set('baseCurrencyAmount', amount);
  url.searchParams.set('apiKey', config.moonpayApiKey);
  return url.toString();
}
