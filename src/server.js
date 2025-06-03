import express from 'express';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import rateLimiter from './middleware/rateLimiter.js';
import transactionsRoute from './routes/transactionsRoute.js';
import job from './config/cron.js';

dotenv.config()

const app = express()
if(process.env.NODE_ENV === 'production') {
    job.start()
}
const PORT = process.env.PORT || 5001

//middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)

//routes
app.use('/api/health', (req, res) => {
    res.status(200).json({status: "OK", message: "Server is running smoothly!"});
})

app.use('/api/transactions',transactionsRoute)

initDB().then(()=> {
    app.listen(PORT,()=> {
    console.log("Server is running on port:",PORT);
    });
})