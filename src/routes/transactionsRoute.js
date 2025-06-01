import express from 'express';
import { createTransaction, deleteTransaction, getTransactionsByUserId, getTransactionSummary } from '../controllers/transactionsController.js';

const router = express.Router()

router.get('/:user_id', getTransactionsByUserId)

router.post('/', createTransaction);

router.delete('/:id',deleteTransaction)

router.get('/summary/:user_id', getTransactionSummary)



export default router