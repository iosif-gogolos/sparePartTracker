const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./spareParts.db');

app.use(cors()); // enable CORS
app.use(bodyParser.json());

app.post('/api/parts', (req, res) => {
    const { licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable, images } = req.body;
    const query = `INSERT INTO spareParts (licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable, images) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable, JSON.stringify(images)], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Spare part added!', id: this.lastID });
    });
});

app.get('/api/parts', (req, res) => {
    db.all('SELECT * FROM spareParts', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/api/parts/:id', (req, res) => {
    const { id } = req.params;
    const { licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable, images } = req.body;
    const query = `UPDATE spareParts SET licensePlate = ?, partNumber = ?, description = ?, complaintDate = ?, reason = ?, price = ?, remarks = ?, creditAvailable = ?, images = ? WHERE id = ?`;
    db.run(query, [licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable, JSON.stringify(images), id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Spare part updated!' });
    });
});

app.delete('/api/parts/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM spareParts WHERE id = ?`;
    db.run(query, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Spare part deleted!' });
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});