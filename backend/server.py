"""Shared REST API for the salon's Expo and standalone clients."""
import base64
import hashlib
import hmac
import http.server
import json
import math
import os
from pathlib import Path
import re
import secrets
from datetime import date, datetime, timedelta
from urllib.parse import urlsplit, unquote
from uuid import uuid4

DB_FILE = Path(__file__).resolve().parent.parent / 'data' / 'database.json'
SESSIONS = {}
BASE_USERS = {'master-1': 'user-master-1', 'master-2': 'user-ihor-1',
              'master-3': 'user-labunskyi-1'}


class Error(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def require(condition, status, message):
    if not condition:
        raise Error(status, message)


def by_id(rows, key):
    return next((row for row in rows if row['id'] == key), None)


def public(user):
    return {k: user[k] for k in ('id', 'email', 'firstName', 'lastName', 'phone', 'role') if k in user}


def digest(password, salt):
    return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 240000).hex()


def set_password(user, password):
    user['salt'] = secrets.token_hex(16)
    user['hash'] = digest(password, user['salt'])


def save(db):
    tmp = DB_FILE.with_suffix('.tmp')
    tmp.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(tmp, DB_FILE)


def load():
    db = json.loads(DB_FILE.read_text(encoding='utf-8-sig')) if DB_FILE.exists() else {}
    for key in ('users', 'masters', 'bookings', 'clients', 'orders'):
        db.setdefault(key, [])
    for master in db['masters']:
        mid = master['id']
        uid = master.get('userId') or BASE_USERS.get(mid) or mid.removeprefix('master-')
        master['userId'] = uid
        user = by_id(db['users'], uid)
        master['active'] = bool(user and user['role'] == 'MASTER')
    # Recover archived columns for bookings left behind by older versions.
    for booking in db['bookings']:
        mid = booking['masterId']
        if not by_id(db['masters'], mid):
            db['masters'].append(dict(id=mid, name=mid, shortName=mid, specialty='',
                                      active=False, userId=mid.removeprefix('master-'), avatarUrl='', appointmentCount=0))
        booking.setdefault('status', 'CONFIRMED')
    for order in db['orders']:
        booking = linked_booking(db, order)
        if booking:
            booking['hasPayment'] = order['status'] == 'COMPLETED'
            booking['colorType'] = 'green' if booking['hasPayment'] else 'mustard'
            if not order.get('bookingId') and len(order.get('services', [])) == 1:
                order['services'] = order['services'][0].split(', ')
            order['itemsCount'] = len(order.get('services', []))
    return db


def linked_booking(db, order):
    key = order.get('bookingId') or order['id'].removeprefix('ord-')
    return by_id(db['bookings'], key) or by_id(db['bookings'], 'b-' + key)


def validate_slot(db, booking):
    master = by_id(db['masters'], booking['masterId'])
    require(master and master.get('active'), 409, 'Майстер недоступний для запису')
    require(date.fromisoformat(booking['date']).isoformat() == booking['date'], 400, 'Некоректна дата')
    start, end = booking['startTime'], booking['endTime']
    require(all(re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', t) for t in (start, end))
            and '10:00' <= start < end <= '21:00', 400, 'Некоректний інтервал')
    for b in db['bookings']:
        if (b['id'] != booking['id'] and b.get('status') != 'CANCELLED'
                and b['masterId'] == master['id'] and b['date'] == booking['date']):
            require(end <= b['startTime'] or start >= b['endTime'], 409, 'Цей час уже зайнятий')


def authenticate(db, path, data):
    email = data['email'].strip().casefold()
    password = data['password']
    users = [u for u in db['users'] if u['email'].strip().casefold() == email]
    if path == 'auth/register':
        require(not users, 409, 'Цю пошту вже зареєстровано')
        require(re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email) and len(password) >= 6,
                400, 'Перевірте пошту й пароль (щонайменше 6 символів)')
        user = {key: data[key].strip() for key in ('firstName', 'lastName', 'phone')}
        user.update(id=str(uuid4()), email=email, role='PENDING')
        set_password(user, password)
        db['users'].append(user)
        save(db)
    else:
        def matches(u):
            if 'hash' in u:
                return hmac.compare_digest(u['hash'], digest(password, u['salt']))
            return bool(password) and hmac.compare_digest(u.get('password', '').encode(), password.encode())
        candidates = [u for u in users if matches(u)]
        require(len(candidates) == 1, 401, 'Невірна пошта або пароль')
        user = candidates[0]
        if 'password' in user:
            set_password(user, user.pop('password'))
            save(db)
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = (user['id'], datetime.now() + timedelta(hours=24))
    return {'success': True, 'user': public(user), 'token': token}


def dispatch(method, path, data, token):
    if method == 'GET' and path == 'health':
        return {'status': 'ok', 'app': 'Svoya Nail Studio'}
    db = load()
    if method == 'POST' and path in ('auth/register', 'auth/login'):
        return authenticate(db, path, data)
    uid, expires = SESSIONS.get(token, (None, datetime.min))
    user = by_id(db['users'], uid)
    require(user and expires > datetime.now(), 401, 'Увійдіть до системи')
    if method == 'GET' and path == 'auth/me':
        return public(user)
    if method == 'POST' and path == 'auth/logout':
        SESSIONS.pop(token, None)
        return {'success': True}
    admin = user['role'] == 'ADMIN'
    require(admin or user['role'] == 'MASTER', 403, 'Доступ відкликано')
    masters = db['masters'] if admin else [m for m in db['masters'] if m.get('userId') == uid and m['active']]
    mine = {m['id'] for m in masters}
    bookings = db['bookings'] if admin else [b for b in db['bookings'] if b['masterId'] in mine]
    resource, _, key = path.partition('/')
    if method == 'GET':
        if path == 'masters':
            return masters
        if path == 'bookings':
            return bookings
        if resource == 'bookings' and key:
            booking = by_id(bookings, key)
            require(booking, 404, 'Запис не знайдено')
            return booking
    if method == 'PUT' and resource == 'bookings' and key:
        booking = by_id(bookings, key)
        require(booking, 404, 'Запис не знайдено')
        if any(field in data for field in ('masterId', 'date', 'startTime')):
            require(admin, 403, 'Потрібні права адміністратора')
            require(booking['status'] == 'CONFIRMED', 409, 'Візит уже закрито')
            updated = {**booking, **{k: data[k] for k in ('masterId', 'date', 'startTime') if k in data}}
            fmt = '%H:%M'
            duration = datetime.strptime(booking['endTime'], fmt) - datetime.strptime(booking['startTime'], fmt)
            updated['endTime'] = (datetime.strptime(updated['startTime'], fmt) + duration).strftime(fmt)
            validate_slot(db, updated)
            booking.update(updated)
            for order in db['orders']:
                if linked_booking(db, order) is booking:
                    order['date'] = booking['date'] + ' ' + booking['startTime']
        if 'status' in data:
            require(data['status'] in ('COMPLETED', 'CANCELLED'), 400, 'Некоректний статус')
            require(booking['status'] in ('CONFIRMED', data['status']), 409, 'Візит уже закрито')
            if data['status'] == 'CANCELLED':
                require(admin, 403, 'Потрібні права адміністратора')
                require(not booking.get('hasPayment'), 409, 'Спершу скасуйте оплату в касі')
                for order in db['orders']:
                    if linked_booking(db, order) is booking:
                        order['status'] = 'CANCELLED'
            else:
                require(datetime.fromisoformat(booking['date'] + 'T' + booking['startTime']) <= datetime.now(),
                        409, 'Візит ще не розпочався')
            booking['status'] = data['status']
        if 'photoUri' in data:
            photo = data['photoUri']
            require(re.fullmatch(r'data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+', photo),
                    400, 'Некоректне фото')
            base64.b64decode(photo.split(',', 1)[1], validate=True)
            booking['photoUri'] = photo
        if 'notes' in data:
            booking['notes'] = data['notes']
        save(db)
        return booking
    require(admin, 403, 'Потрібні права адміністратора')
    if method == 'GET' and path in ('clients', 'orders', 'users'):
        return [public(u) for u in db['users']] if path == 'users' else db[path]
    if method == 'GET' and resource == 'users':
        target = by_id(db['users'], key)
        require(target, 404, 'Користувача не знайдено')
        return public(target)
    if resource == 'users' and key and method in ('DELETE', 'PUT'):
        target = by_id(db['users'], key)
        require(target, 404, 'Користувача не знайдено')
        require(key != uid, 409, 'Не можна змінювати власний доступ')
        if method == 'DELETE':
            db['users'].remove(target)
        else:
            role = data['role']
            require(role in ('MASTER', 'ADMIN', 'PENDING'), 400, 'Невідома роль')
            if target['role'] != 'PENDING' and role != target['role']:
                revoke(key)
            target['role'] = role
            if role == 'MASTER' and not any(m.get('userId') == key for m in masters):
                name = (target['firstName'] + ' ' + target['lastName']).strip()
                db['masters'].append(dict(id='master-' + key, userId=key, name=name,
                                          shortName=name, specialty='Майстер', avatarUrl='', appointmentCount=0))
        if method == 'DELETE':
            revoke(key)
    elif method == 'POST' and path == 'reset':
        for collection in ('orders', 'bookings', 'clients'):
            db[collection].clear()
        for m in masters:
            m['appointmentCount'] = 0
    elif method == 'POST' and path in ('clients', 'orders'):
        data['id'] = data.get('id') or str(uuid4())
        require(not by_id(db[path], data['id']), 409, 'Запис уже існує')
        db[path].insert(0, data)
        save(db)
        return data
    elif method == 'POST' and path == 'bookings':
        services = data.get('services')
        require(isinstance(services, list) and services and all(isinstance(s, str) and s.strip() for s in services),
                400, 'Оберіть послугу')
        require(isinstance(data.get('price'), (int, float)) and math.isfinite(data['price']) and data['price'] >= 0,
                400, 'Некоректна ціна')
        data.update(id='b-' + str(uuid4()), serviceName=', '.join(services), status='CONFIRMED',
                    hasPayment=False, colorType='mustard', isConfirmed=True)
        validate_slot(db, data)
        if data.get('clientId'):
            require(by_id(db['clients'], data['clientId']), 409, 'Клієнта не знайдено')
        db['bookings'].insert(0, data)
        master = by_id(masters, data['masterId'])
        master['appointmentCount'] = master.get('appointmentCount', 0) + 1
        db['orders'].insert(0, dict(id='ord-' + data['id'], bookingId=data['id'], status='UNPAID',
            orderNumber='№' + str(1000 + len(db['orders'])), date=data['date'] + ' ' + data['startTime'],
            clientId=data.get('clientId'), clientName=data['clientName'], clientPhone=data.get('clientPhone', ''),
            cashierName=user['firstName'] + ' ' + user['lastName'], itemsCount=len(services),
            services=services, totalAmount=data['price'], paymentMethod='CARD'))
        save(db)
        return data
    elif method == 'PUT' and resource == 'orders':
        order = by_id(db['orders'], key)
        require(order, 404, 'Чек не знайдено')
        require(data['status'] in ('UNPAID', 'COMPLETED', 'CANCELLED'), 400, 'Некоректний статус')
        booking = linked_booking(db, order)
        require(not booking or booking['status'] != 'CANCELLED' or data['status'] == 'CANCELLED',
                409, 'Візит скасовано')
        order['status'] = data['status']
        if booking:
            booking['hasPayment'] = order['status'] == 'COMPLETED'
            booking['colorType'] = 'green' if booking['hasPayment'] else 'mustard'
    else:
        raise Error(404, 'Не знайдено')
    save(db)
    return {'success': True}


def revoke(uid):
    for token, (owner, _) in list(SESSIONS.items()):
        if owner == uid:
            del SESSIONS[token]


class ApiHandler(http.server.BaseHTTPRequestHandler):
    def reply(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_api(self):
        try:
            path = unquote(urlsplit(self.path).path)
            require(path.startswith('/api/'), 404, 'Не знайдено')
            size = int(self.headers.get('Content-Length', 0))
            require(0 <= size <= 12_000_000, 413, 'Фото завелике')
            data = json.loads(self.rfile.read(size)) if size else {}
            require(isinstance(data, dict), 400, 'Некоректний запит')
            token = self.headers.get('Authorization', '').removeprefix('Bearer ')
            result = dispatch(self.command, path[5:].rstrip('/'), data, token)
            self.reply(201 if self.command == 'POST' and path.endswith(('/register','/clients','/orders','/bookings')) else 200, result)
        except Error as e:
            self.reply(e.status, {'error': str(e)})
        except (KeyError, ValueError, TypeError, AttributeError):
            self.reply(400, {'error': 'Некоректні дані'})
        except OSError:
            self.reply(500, {'error': 'Помилка збереження даних'})

    do_GET = do_POST = do_PUT = do_DELETE = handle_api

    def do_OPTIONS(self):
        self.reply(200, {})


def migrate_credentials():
    db = load()
    changed = False
    for user in db['users']:
        if 'password' in user:
            set_password(user, user.pop('password'))
            changed = True
    if changed:
        save(db)


if __name__ == '__main__':
    with http.server.HTTPServer(('', 8000), ApiHandler) as server:
        migrate_credentials()
        server.serve_forever()
