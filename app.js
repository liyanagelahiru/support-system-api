const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: '178.128.28.228',
    user: 'bdjwanchne',
    password: 'rBvX9KgDX2',
    database: 'bdjwanchne',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// POST route to create a new ticket
app.post('/api/tickets', async (req, res) => {
    const { id, ticket_number, category_id, user_id, priority_id, ticket_data, name, email, subject, message, status, priority } = req.body;
    const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
        // Check if the email already exists with status 2
        const [existingTickets] = await pool.query('SELECT * FROM support_tickets WHERE email = ? AND status = 2', [email]);
        if (existingTickets.length > 0) {
            // Update the support_messages table
            const updateMessageSql = `UPDATE support_messages SET message = CONCAT(message, '<p>', ?, '</p>') WHERE support_ticket_id = ?`;
            await pool.query(updateMessageSql, [message, existingTickets[0].id]);

            return res.status(200).send('Message updated successfully in the existing ticket.');
        }

        // Insert the new ticket
        const sql = `INSERT INTO support_tickets (id, ticket_number, category_id, user_id, priority_id, ticket_data, name, email, subject, message, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await pool.query(sql, [id, ticket_number, category_id, user_id, priority_id, ticket_data, name, email, subject, message, status, priority, created_at]);
        
        // Check if a corresponding entry exists in the support_messages table
        const [existingMessages] = await pool.query('SELECT * FROM support_messages WHERE support_ticket_id = ?', [result.insertId]);
        if (existingMessages.length === 0) {
            // Update the support_messages table if no entry exists
            const messageSql = `INSERT INTO support_messages (support_ticket_id, message, created_at, file, editor_files) VALUES (?, ?, ?, '[]', '[]')`;
            await pool.query(messageSql, [result.insertId, message, created_at]);
        }

        res.status(201).send('Ticket created successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error inserting data into the database');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
