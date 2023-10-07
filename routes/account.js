const express = require('express')
const router = express.Router()
const db = require('../api.js')

router.get('/getaccount', async (req, res) => {
    try {
        const { id, email, token } = req.query;
        let account = null;
        if (id != null) {
            account = await db.get_account(id);
        } else if (email != null) {
            account = await db.get_account_email(email);
        } else if (token != null) {
            account = await db.get_user_token(token);
        }
        if (account != null) {
            res.json(account);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/getaccounttoken', async (req, res) => {
    try {
        const { token } = req.query;
        const id = await db.get_user_id_token(token);
        if (id != null) {
            res.json(id);
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Define your API route to create an account
router.post('/loginaccount', async (req, res) => {
    try {
        const { email, name, type, token } = req.body;
        const account = await db.get_account_email(email);
        if (account == null && type == 'google')  {
            const insertId = await db.create_account({ email, name, type });
            await db.create_token(token, insertId);
            return res.status(201).json({ message: 'Account created successfully' });
        } else if (account == null && type == 'teacher') {
            return res.status(500);
        } else if (account != null) {
            const id = account.id;
            await db.create_token(token, id);
            res.status(201).json({ message: 'Token created successfully' });
        }
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/logoutaccount', async (req, res) => {
    try {
        const { token } = req.body;
        await db.delete_token(token);
        res.status(201).json({ message: 'Token deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;