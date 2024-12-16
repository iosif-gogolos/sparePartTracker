from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

# Flask-App initialisieren
app = Flask(__name__)
CORS(app)  # Cross-Origin Resource Sharing aktivieren

# MySQL-Verbindung konfigurieren
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Teapot+@=Basket',  # Ihr MySQL-Passwort
    'database': 'ersatzteile_db'
}

# Route zum Hinzufügen eines Ersatzteils
@app.route('/add-part', methods=['POST'])
def add_part():
    try:
        # JSON-Daten aus der Anfrage lesen
        data = request.json
        licensePlate = data['licensePlate']
        partNumber = data['partNumber']
        description = data.get('description', '')
        complaintDate = data['complaintDate']
        reason = data['reason']
        price = data.get('price', '0.00')
        remarks = data.get('remarks', '')
        creditAvailable = data['creditAvailable']

        # Verbindung zur Datenbank herstellen
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # SQL-Befehl ausführen
        query = """
            INSERT INTO parts (licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (licensePlate, partNumber, description, complaintDate, reason, price, remarks, creditAvailable)
        cursor.execute(query, values)
        conn.commit()

        # Erfolgsmeldung zurückgeben
        return jsonify({'message': 'Ersatzteil erfolgreich hinzugefügt!', 'id': cursor.lastrowid}), 200

    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 500

    finally:
        cursor.close()
        conn.close()

# Flask-Server starten
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
