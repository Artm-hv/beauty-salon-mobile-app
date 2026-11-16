import json
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from unittest.mock import patch

import server


class QuietHandler(server.ApiHandler):
    def log_message(self, *args):
        pass


class SalonWorkflowTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        db = Path(directory.name) / 'database.json'
        self.enterContext(patch.object(server, 'DB_FILE', db))
        self.enterContext(patch.object(server, 'SESSIONS', {}))
        self.admin_user = dict(id='admin', email='admin@example.test', firstName='A', lastName='B',
                               phone='', password='test-secret', role='ADMIN')
        self.master_user = {**self.admin_user, 'id': 'user-master-1', 'email': 'master@example.test', 'role': 'MASTER'}
        db.write_text(json.dumps(dict(users=[self.admin_user, self.master_user],
                                      masters=[dict(id='master-1', name='A B', appointmentCount=0)])))
        self.http = HTTPServer(('127.0.0.1', 0), QuietHandler)
        self.addCleanup(self.http.server_close)
        thread = threading.Thread(target=self.http.serve_forever, kwargs={'poll_interval': 0.01}, daemon=True)
        thread.start()
        self.addCleanup(thread.join)
        self.addCleanup(self.http.shutdown)
        self.admin = self.login(self.admin_user)
        self.master = self.login(self.master_user)
        self.booking = dict(masterId='master-1', clientName='Customer', clientPhone='',
                            services=['Manicure', 'Design'], date='2020-03-12',
                            startTime='12:00', endTime='13:30', price=800)

    def call(self, method, path, data=None, token=None, expected=200):
        conn = HTTPConnection(*self.http.server_address, timeout=10)
        try:
            conn.request(method, '/api/' + path, body=json.dumps(data) if data is not None else None,
                         headers={'Authorization': 'Bearer ' + token} if token else {})
            response = conn.getresponse()
            payload = json.load(response)
            self.assertEqual(response.status, expected, payload)
            return payload
        finally:
            conn.close()

    def login(self, user):
        return self.call('POST', 'auth/login', user)['token']

    def test_approval_revocation_rehire_and_firing(self):
        account = {**self.admin_user, 'email': 'Other@Example.test', 'id': 'admin'}
        pending = self.call('POST', 'auth/register', account, expected=201)
        self.assertEqual(pending['user']['role'], 'PENDING')
        self.assertNotEqual(pending['user']['id'], 'admin')
        self.call('GET', 'bookings', token=pending['token'], expected=403)
        self.call('POST', 'auth/register', {**account, 'email': ' other@example.test '}, expected=409)
        key = 'users/' + pending['user']['id']
        self.call('PUT', key, {'role': 'MASTER'}, self.admin)
        self.assertEqual(self.call('GET', 'auth/me', token=pending['token'])['role'], 'MASTER')
        self.call('PUT', key, {'role': 'PENDING'}, self.admin)
        self.call('GET', 'auth/me', token=pending['token'], expected=401)
        waiting = self.login(account)
        self.call('GET', 'bookings', token=waiting, expected=403)
        self.call('PUT', key, {'role': 'MASTER'}, self.admin)
        self.call('DELETE', key, token=self.admin)
        self.call('GET', 'bookings', token=waiting, expected=401)
        self.call('POST', 'auth/login', account, expected=401)

    def test_access_boundaries(self):
        for path in ('clients', 'orders', 'users', 'users/admin', 'bookings', 'masters'):
            self.call('GET', path, expected=401)
        for path in ('clients', 'orders', 'users'):
            self.call('GET', path, token=self.master, expected=403)
        for method, path in [('PUT', 'users/admin'), ('DELETE', 'users/admin'), ('POST', 'reset')]:
            self.call(method, path, {'role': 'ADMIN'}, self.master, expected=403)
        for user in self.call('GET', 'users', token=self.admin):
            self.assertFalse({'password', 'hash', 'salt'} & user.keys())
        self.call('POST', 'auth/logout', token=self.master)
        self.call('GET', 'auth/me', token=self.master, expected=401)

    def test_slot_and_receipt_lifecycle(self):
        self.call('POST', 'bookings', {**self.booking, 'services': []}, self.admin, 400)
        visit = self.call('POST', 'bookings', self.booking, self.admin, 201)
        key = 'bookings/' + visit['id']
        order, = self.call('GET', 'orders', token=self.admin)
        self.assertEqual((order['itemsCount'], order['services']), (2, self.booking['services']))
        self.call('POST', 'bookings', {**self.booking, 'startTime': '11:00', 'endTime': '12:30'}, self.admin, 409)
        self.call('POST', 'bookings', {**self.booking, 'startTime': '13:30', 'endTime': '14:00'}, self.admin, 201)
        receipt = 'orders/' + order['id']
        self.call('PUT', receipt, {'status': 'COMPLETED'}, self.admin)
        before = self.call('GET', key, token=self.master)
        self.assertTrue(before['hasPayment'])
        self.assertEqual(before['status'], 'CONFIRMED')
        photo = 'data:image/jpeg;base64,/9j/2Q=='
        self.call('PUT', key, {'photoUri': photo, 'status': 'COMPLETED'}, self.master)
        self.assertEqual(self.call('GET', key, token=self.admin)['photoUri'], photo)
        self.call('PUT', receipt, {'status': 'CANCELLED'}, self.admin)
        after = self.call('GET', key, token=self.master)
        self.assertFalse(after['hasPayment'])
        self.assertEqual(after['status'], 'COMPLETED')

    def test_same_name_isolation_archive_and_reassignment(self):
        visit = self.call('POST', 'bookings', self.booking, self.admin, 201)
        new = self.call('POST', 'auth/register', {**self.master_user, 'email': 'second@example.test'}, expected=201)
        self.call('PUT', 'users/' + new['user']['id'], {'role': 'MASTER'}, self.admin)
        key = 'bookings/' + visit['id']
        other = new['token']
        replacement, = self.call('GET', 'masters', token=other)
        self.assertEqual(self.call('GET', 'bookings', token=other), [])
        self.call('PUT', key, {'notes': 'x'}, other, 404)
        self.call('DELETE', 'users/user-master-1', token=self.admin)
        self.call('POST', 'bookings', self.booking, self.admin, 409)
        self.assertFalse(self.call('GET', 'masters', token=self.admin)[0]['active'])
        moved = self.call('PUT', key, {'masterId': replacement['id'], 'startTime': '14:00'}, self.admin)
        self.assertEqual(moved['endTime'], '15:30')
        self.assertEqual(self.call('GET', key, token=other)['id'], visit['id'])

    def test_two_devices_cannot_book_same_slot(self):
        def reserve(_):
            connection = HTTPConnection(*self.http.server_address)
            try:
                connection.request('POST', '/api/bookings', json.dumps(self.booking),
                                   {'Authorization': 'Bearer ' + self.admin})
                return connection.getresponse().status
            finally:
                connection.close()
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(reserve, range(2))), [201, 409])
        self.assertEqual(len(self.call('GET', 'orders', token=self.admin)), 1)

