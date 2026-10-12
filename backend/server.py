"""
REST API Сервер для мобільного додатку "Svoya Nail Studio"
Дисципліна: Мобільні додатки (PWSZ / Університет)
Розробники: Артем Гіжовський, Ігор Намачинський, Артем Лабунський

Методи API згідно з вимогами предмету:
1. GET  - Отримання даних (/api/clients, /api/bookings, /api/orders, /api/masters)
2. POST - Створення нових записів (/api/clients, /api/bookings, /api/orders)
3. PUT  - Оновлення існуючих записів (/api/bookings/<id>)
"""

import http.server
import json
import os
import urllib.parse

PORT = 8000
DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'database.json')

def load_db():
    if not os.path.exists(DB_FILE):
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        default_data = {
            "masters": [
                {
                    "id": "master-1",
                    "name": "Артем Гіжовський",
                    "shortName": "Артем Г.",
                    "specialty": "Топ-майстер / Адмін",
                    "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
                    "appointmentCount": 0
                },
                {
                    "id": "master-2",
                    "name": "Ігор Намачинський",
                    "shortName": "Ігор Н.",
                    "specialty": "Майстер",
                    "avatarUrl": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces",
                    "appointmentCount": 0
                },
                {
                    "id": "master-3",
                    "name": "Артем Лабунський",
                    "shortName": "Артем Л.",
                    "specialty": "Майстер",
                    "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
                    "appointmentCount": 0
                }
            ],
            "clients": [],
            "bookings": [],
            "orders": []
        }
        save_db(default_data)
        return default_data

    with open(DB_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except Exception:
            return {"masters": [], "clients": [], "bookings": [], "orders": []}

def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class ApiHandler(http.server.BaseHTTPRequestHandler):
    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def _send_json(self, status, payload):
        self.send_response(status)
        self._set_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def _read_json(self):
        content_len = int(self.headers.get('Content-Length', 0))
        if content_len == 0:
            return {}
        body = self.rfile.read(content_len).decode('utf-8')
        try:
            return json.loads(body)
        except Exception:
            return {}

    # ==========================
    # 1. МЕТОД GET (Отримання)
    # ==========================
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        db = load_db()

        if path == '/api/clients':
            self._send_json(200, db.get('clients', []))
        elif path == '/api/bookings':
            self._send_json(200, db.get('bookings', []))
        elif path == '/api/orders':
            self._send_json(200, db.get('orders', []))
        elif path == '/api/masters':
            self._send_json(200, db.get('masters', []))
        elif path == '/api/health':
            self._send_json(200, {"status": "ok", "app": "Svoya Nail Studio Backend"})
        else:
            self._send_json(404, {"error": "Endpoint not found"})

    # ==========================
    # 2. МЕТОД POST (Створення)
    # ==========================
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        data = self._read_json()
        db = load_db()

        if path == '/api/clients':
            clients = db.setdefault('clients', [])
            clients.insert(0, data)
            save_db(db)
            self._send_json(201, data)

        elif path == '/api/bookings':
            bookings = db.setdefault('bookings', [])
            bookings.insert(0, data)

            # Оновлюємо кількість візитів у майстра
            master_id = data.get('masterId')
            for m in db.get('masters', []):
                if m.get('id') == master_id:
                    m['appointmentCount'] = m.get('appointmentCount', 0) + 1

            # Автоматично створюємо відповідний чек на касі
            orders = db.setdefault('orders', [])
            new_order = {
                "id": f"ord-{data.get('id', 'new')}",
                "orderNumber": f"№{1000 + len(orders)}",
                "status": "UNPAID",
                "date": f"{data.get('date', '')} {data.get('startTime', '')}",
                "clientName": data.get('clientName', 'Клієнт'),
                "clientPhone": data.get('clientPhone', ''),
                "cashierName": "Артем Гіжовський (Адміністратор)",
                "itemsCount": 1,
                "services": [data.get('serviceName', 'Послуга')],
                "totalAmount": data.get('price', 0),
                "paymentMethod": "CARD"
            }
            orders.insert(0, new_order)

            save_db(db)
            self._send_json(201, data)

        elif path == '/api/orders':
            orders = db.setdefault('orders', [])
            orders.insert(0, data)
            save_db(db)
            self._send_json(201, data)

        elif path == '/api/reset':
            # Скидання до початкового чистого стану
            default_data = {
                "masters": [
                    {
                        "id": "master-1",
                        "name": "Артем Гіжовський",
                        "shortName": "Артем Г.",
                        "specialty": "Топ-майстер / Адмін",
                        "avatarUrl": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
                        "appointmentCount": 0
                    },
                    {
                        "id": "master-2",
                        "name": "Ігор Намачинський",
                        "shortName": "Ігор Н.",
                        "specialty": "Майстер",
                        "avatarUrl": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces",
                        "appointmentCount": 0
                    },
                    {
                        "id": "master-3",
                        "name": "Артем Лабунський",
                        "shortName": "Артем Л.",
                        "specialty": "Майстер",
                        "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
                        "appointmentCount": 0
                    }
                ],
                "clients": [],
                "bookings": [],
                "orders": []
            }
            save_db(default_data)
            self._send_json(200, {"success": True, "message": "Database reset to clean state"})

        else:
            self._send_json(404, {"error": "Endpoint not found"})

    # ==========================
    # 3. МЕТОД PUT (Оновлення)
    # ==========================
    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')
        data = self._read_json()
        db = load_db()

        if path.startswith('/api/bookings/'):
            booking_id = path.replace('/api/bookings/', '')
            updated = None
            for b in db.get('bookings', []):
                if b.get('id') == booking_id:
                    if 'status' in data and data['status'] == 'COMPLETED':
                        b['hasPayment'] = True
                    if 'notes' in data:
                        b['notes'] = data['notes']
                    updated = b
                    break

            if updated:
                save_db(db)
                self._send_json(200, {"success": True, "data": updated})
            else:
                self._send_json(404, {"error": "Booking not found"})

        elif path.startswith('/api/orders/'):
            order_id = path.replace('/api/orders/', '')
            updated = None
            for ord in db.get('orders', []):
                if ord.get('id') == order_id:
                    if 'status' in data:
                        ord['status'] = data['status']
                    updated = ord
                    break

            if updated:
                # Синхронізація: якщо замовлення оплачено — відмітити в календарі
                if updated.get('status') == 'COMPLETED':
                    target_b_id = order_id.replace('ord-', '')
                    for b in db.get('bookings', []):
                        if b.get('id') == target_b_id or b.get('id') == f"b-{target_b_id}":
                            b['hasPayment'] = True
                            b['colorType'] = 'green'

                save_db(db)
                self._send_json(200, {"success": True, "data": updated})
            else:
                self._send_json(404, {"error": "Order not found"})

        else:
            self._send_json(404, {"error": "Endpoint not found"})

def run():
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, ApiHandler)
    print("================================================================")
    print(f"[OK] SVOYA NAIL STUDIO - REST API Server running on port {PORT}")
    print(f"Database: {DB_FILE}")
    print("API Methods: GET, POST, PUT")
    print("================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.server_close()

if __name__ == '__main__':
    run()
