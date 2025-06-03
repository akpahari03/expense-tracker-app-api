// transactionsController.js - Updated with better error handling and debugging

import {sql} from '../config/db.js'

export async function createTransaction(req, res) {
    try {
        console.log("=== CREATE TRANSACTION DEBUG ===");
        console.log("req.body:", req.body);
        console.log("req.headers:", req.headers);
        console.log("Content-Type:", req.get('Content-Type'));
        console.log("req.body type:", typeof req.body);
        console.log("req.body keys:", req.body ? Object.keys(req.body) : 'no keys');

        // Check if req.body exists
        if (!req.body) {
            console.error("req.body is undefined or null");
            return res.status(400).json({
                error: "Request body is missing",
                contentType: req.get('Content-Type'),
                headers: req.headers
            });
        }

        // Check if req.body is empty object
        if (Object.keys(req.body).length === 0) {
            console.error("req.body is empty object");
            return res.status(400).json({
                error: "Request body is empty",
                contentType: req.get('Content-Type'),
                headers: req.headers
            });
        }

        const {title, amount, category, user_id} = req.body;
        
        console.log("Extracted values:", {title, amount, category, user_id});

        // Validate required fields
        if (!title || !user_id || !category || amount === undefined) {
            console.error("Missing required fields:", {
                title: !!title,
                user_id: !!user_id,
                category: !!category,
                amount: amount !== undefined
            });
            return res.status(400).json({
                error: "All fields are required",
                received: {title, amount, category, user_id},
                missing: {
                    title: !title,
                    user_id: !user_id,
                    category: !category,
                    amount: amount === undefined
                }
            });
        }

        // Log the incoming request data
        console.log("Creating transaction with data:", { title, amount, category, user_id });

        try {
            const transaction = await sql`
                INSERT INTO transactions(user_id, title, amount, category)
                VALUES (${user_id}, ${title}, ${amount}, ${category})
                RETURNING *;
            `;
            console.log("Transaction created successfully:", transaction);
            res.status(201).json(transaction[0]);
        } catch (dbError) {
            console.error("Database error details:", {
                message: dbError.message,
                code: dbError.code,
                detail: dbError.detail,
                hint: dbError.hint,
                where: dbError.where
            });
            throw dbError;
        }
    }
    catch (error) {
        console.error("Detailed error creating transaction:", {
            error: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            where: error.where
        });
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
            code: error.code,
            detail: error.detail
        });
    }
}

// Keep your other functions unchanged
export async function getTransactionsByUserId(req,res) {
    try {
        const {user_id} = req.params
        const transactions = await sql`SELECT * FROM transactions WHERE user_id = ${user_id} ORDER BY created_at DESC;`

        if (transactions.length === 0) {
            return res.status(404).json({error: "No transactions found for this user"})
        }
        res.status(200).json(transactions)
    }
    catch (error) {
        console.error("Error fetching transactions:", error)
        return res.status(500).json({error: "Internal server error"})
    }
} 

export async function deleteTransaction(req,res){
    try {
        const {id} = req.params

        if(isNaN(parseInt(id))) {
            return res.status(400).json({error: "Invalid transaction ID"});
        }
        const result = await sql`DELETE FROM transactions WHERE id = ${id} RETURNING *;`
        if (result.length === 0) {
            return res.status(404).json({error: "Transaction not found"});
        }
        console.log("Transaction deleted:", result[0]);
        res.status(200).json({message: "Transaction deleted successfully", transaction: result[0]});
    } 
    catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({error:"Internal server error"});
    }
}

export async function getTransactionSummary(req, res) {
    try {
        const {user_id} = req.params;
        const balanceResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS balance FROM transactions 
            WHERE user_id = ${user_id}
        `;
        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS income FROM transactions 
            WHERE user_id = ${user_id} AND amount > 0
        `;
        const expenseResult = await sql`
            SELECT COALESCE(SUM(amount),0) AS expense FROM transactions 
            WHERE user_id = ${user_id} AND amount < 0
        `;
        res.status(200).json({
            message: "Transaction summary fetched successfully",
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expense: expenseResult[0].expense
        });
    } catch (error) {
        console.error("Error fetching transaction summary:", error);
        res.status(500).json({error:"Internal server error"});
    }
}