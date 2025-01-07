const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./spareParts.db');

app.use(bodyParser.json());

app.post('/addSparePart', (req, res) => {
    const { Kennzeichen, Teilenummer, Beschreibung, Reklamationsdatum, Grund, Preis, Bemerkung, Gutschrift_vorhanden } = req.body;
    const query = `INSERT INTO spareParts (Kennzeichen, Teilenummer, Teil, Reklamationsdatum, Reklamationsgrund, Preis, Bemerkung, Gutschrift_vorhanden) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [Kennzeichen, Teilenummer, Teil, Reklamationsdatum, Reklamationsdatum, Preis, Bemerkung, Gutschrift_vorhanden], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Spare part added!', id: this.lastID });
    });
});

app.get('/spareParts', (req, res) => {
    db.all('SELECT * FROM spareParts', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ spareParts: rows });
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
