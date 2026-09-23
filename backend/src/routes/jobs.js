import { Router } from 'express';
import { createJob, listJobs, claimJob, submitJob, updateJobStatus } from '../services/database.js';

const router = Router();
const wallet = (req) => String(req.body?.walletAddress || req.query?.walletAddress || '').trim().toLowerCase();

router.get('/', async (req, res) => {
  try { res.json({ jobs: await listJobs({ status: req.query.status === undefined ? 'open' : String(req.query.status || ''), creatorWallet: req.query.creatorWallet || null, workerWallet: req.query.workerWallet || null, limit: req.query.limit }) }); }
  catch (error) { res.status(500).json({ error:error.message }); }
});

router.post('/', async (req, res) => {
  try {
    const creatorWallet=wallet(req); if(!creatorWallet) return res.status(400).json({error:'walletAddress is required'});
    const title=String(req.body?.title||'').trim(), description=String(req.body?.description||'').trim();
    if(!title||!description) return res.status(400).json({error:'title and description are required'});
    const job=await createJob({creatorWallet,companyId:req.body?.companyId||null,title,description,budgetAmount:req.body?.budgetAmount||null,budgetAsset:req.body?.budgetAsset||null,network:req.body?.network||null,dueAt:req.body?.dueAt||null});
    res.status(201).json({job});
  } catch(error){res.status(400).json({error:error.message});}
});

router.post('/:id/claim', async (req,res)=>{
  try { const w=wallet(req); if(!w)return res.status(400).json({error:'walletAddress is required'}); const job=await claimJob(req.params.id,w); if(!job)return res.status(409).json({error:'Job is no longer open or could not be claimed'}); res.json({job}); }
  catch(error){res.status(400).json({error:error.message});}
});

router.post('/:id/submit', async (req,res)=>{
  try { const w=wallet(req), submission=String(req.body?.submission||'').trim(); if(!w||!submission)return res.status(400).json({error:'walletAddress and submission are required'}); const job=await submitJob(req.params.id,w,submission); if(!job)return res.status(409).json({error:'Job is not assigned to you or is not submittable'}); res.json({job}); }
  catch(error){res.status(400).json({error:error.message});}
});

router.post('/:id/status', async (req,res)=>{
  try { const w=wallet(req); const status=String(req.body?.status||''); if(!w||!status)return res.status(400).json({error:'walletAddress and status are required'}); const job=await updateJobStatus(req.params.id,status,w); if(!job)return res.status(403).json({error:'Job not found or creator access denied'}); res.json({job}); }
  catch(error){res.status(400).json({error:error.message});}
});

export default router;
