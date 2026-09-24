import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  robankLlmBaseUrl: process.env.ROBANK_LLM_BASE_URL || 'https://openrouter.ai/api/v1',
  robankLlmApiKey: process.env.ROBANK_LLM_API_KEY || '',
  robankLlmModel: process.env.ROBANK_LLM_MODEL || 'xiaomi/mimo-v2.6-flash',
  moonpayApiKey: process.env.MOONPAY_API_KEY || '',
  moonpaySecretKey: process.env.MOONPAY_SECRET_KEY || '',
  baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  robinhoodRpcUrl: process.env.ROBINHOOD_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com',
  diditApiKey: process.env.DIDIT_API_KEY || '',
  diditKybWorkflowId: process.env.DIDIT_KYB_WORKFLOW_ID || '',
  diditKycWorkflowId: process.env.DIDIT_KYC_WORKFLOW_ID || '',
  tiingoApiKey: process.env.TIINGO_API_KEY || '',
  privyAppId: process.env.PRIVY_APP_ID || '',
  privyAppSecret: process.env.PRIVY_APP_SECRET || '',
  robankOwnerWallet: (process.env.ROBANK_OWNER_WALLET || '').trim().toLowerCase()
};
