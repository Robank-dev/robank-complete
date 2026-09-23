import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

router.post('/session', async (req,res)=>{
  try {
    const walletAddress=String(req.body?.walletAddress||'').trim().toLowerCase();
    if(!walletAddress)return res.status(400).json({error:'walletAddress is required'});
    if(!config.diditApiKey||!config.diditKycWorkflowId)return res.status(503).json({error:'Didit KYC is not configured. Set DIDIT_API_KEY and DIDIT_KYC_WORKFLOW_ID.'});
    const response=await fetch('https://verification.didit.me/v3/session/',{method:'POST',headers:{'x-api-key':config.diditApiKey,'Content-Type':'application/json'},body:JSON.stringify({workflow_id:config.diditKycWorkflowId,vendor_data:`robank-user-${walletAddress}`})});
    const data=await response.json();
    if(!response.ok)return res.status(502).json({error:data?.detail||data?.message||'Didit KYC session creation failed'});
    res.status(201).json({provider:'didit',sessionId:data.session_id,url:data.url});
  } catch(error){res.status(502).json({error:error.message});}
});

export default router;
