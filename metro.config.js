const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

const DB_FILE = path.join(__dirname, 'data', 'database.json');

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {}
  return { masters: [], clients: [], bookings: [], orders: [] };
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

const originalEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const parent = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(metroMiddleware, server)
      : metroMiddleware;

    return (req, res, next) => {
      // Дозволяємо CORS для взаємодії між пристроями
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const url = req.url || '';
      const [pathname] = url.split('?');

      if (pathname.startsWith('/api/')) {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          let data = {};
          if (body) {
            try {
              data = JSON.parse(body);
            } catch (e) {}
          }

          const db = loadDb();

          // 1. Метод GET (Отримання списків)
          if (req.method === 'GET') {
            if (pathname === '/api/clients') {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify(db.clients || []));
              return;
            }
            if (pathname === '/api/bookings') {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify(db.bookings || []));
              return;
            }
            if (pathname === '/api/orders') {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify(db.orders || []));
              return;
            }
            if (pathname === '/api/masters') {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify(db.masters || []));
              return;
            }
            if (pathname === '/api/health') {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify({ status: 'ok', source: 'metro_middleware' }));
              return;
            }
          }

          // 2. Метод POST (Створення записів)
          if (req.method === 'POST') {
            if (pathname === '/api/clients') {
              db.clients = db.clients || [];
              db.clients.unshift(data);
              saveDb(db);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 201;
              res.end(JSON.stringify(data));
              return;
            }
            if (pathname === '/api/bookings') {
              db.bookings = db.bookings || [];
              db.bookings.unshift(data);

              // Оновлення лічильника майстра
              if (data.masterId && db.masters) {
                const m = db.masters.find((x) => x.id === data.masterId);
                if (m) m.appointmentCount = (m.appointmentCount || 0) + 1;
              }

              // Автоматичне створення чека в касі
              db.orders = db.orders || [];
              const newOrder = {
                id: `ord-${data.id || Date.now()}`,
                orderNumber: `№${1000 + db.orders.length}`,
                status: 'UNPAID',
                date: `${data.date || ''} ${data.startTime || ''}`,
                clientName: data.clientName || 'Клієнт',
                clientPhone: data.clientPhone || '',
                cashierName: 'Артем Гіжовський (Адміністратор)',
                itemsCount: 1,
                services: [data.serviceName || 'Послуга'],
                totalAmount: data.price || 0,
                paymentMethod: 'CARD',
              };
              db.orders.unshift(newOrder);

              saveDb(db);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 201;
              res.end(JSON.stringify(data));
              return;
            }
            if (pathname === '/api/orders') {
              db.orders = db.orders || [];
              db.orders.unshift(data);
              saveDb(db);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 201;
              res.end(JSON.stringify(data));
              return;
            }
            if (pathname === '/api/reset') {
              const defaultData = {
                masters: [
                  {
                    id: 'master-1',
                    name: 'Артем Гіжовський',
                    shortName: 'Артем Г.',
                    specialty: 'Топ-майстер / Адмін',
                    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
                    appointmentCount: 0,
                  },
                  {
                    id: 'master-2',
                    name: 'Ігор Намачинський',
                    shortName: 'Ігор Н.',
                    specialty: 'Майстер',
                    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
                    appointmentCount: 0,
                  },
                  {
                    id: 'master-3',
                    name: 'Артем Лабунський',
                    shortName: 'Артем Л.',
                    specialty: 'Майстер',
                    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
                    appointmentCount: 0,
                  },
                ],
                clients: [],
                bookings: [],
                orders: [],
              };
              saveDb(defaultData);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'Database reset' }));
              return;
            }
          }

          // 3. Метод PUT (Оновлення записів)
          if (req.method === 'PUT') {
            if (pathname.startsWith('/api/bookings/')) {
              const bId = pathname.replace('/api/bookings/', '');
              db.bookings = db.bookings || [];
              let updated = null;
              for (const b of db.bookings) {
                if (b.id === bId) {
                  if (data.status === 'COMPLETED') b.hasPayment = true;
                  if (data.notes) b.notes = data.notes;
                  updated = b;
                  break;
                }
              }
              if (updated) {
                saveDb(db);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, data: updated }));
                return;
              }
            }
            if (pathname.startsWith('/api/orders/')) {
              const oId = pathname.replace('/api/orders/', '');
              db.orders = db.orders || [];
              let updated = null;
              for (const o of db.orders) {
                if (o.id === oId) {
                  if (data.status) o.status = data.status;
                  updated = o;
                  break;
                }
              }
              if (updated) {
                saveDb(db);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, data: updated }));
                return;
              }
            }
          }

          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        });
        return;
      }

      return parent(req, res, next);
    };
  },
};

module.exports = config;
