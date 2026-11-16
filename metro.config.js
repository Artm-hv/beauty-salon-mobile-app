const { getDefaultConfig } = require('expo/metro-config');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
// Development bundles must never include the server's private data file.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList || []),
  /[/\\]data[/\\]database\.(?:json|tmp)$/,
];
const enhance = config.server?.enhanceMiddleware;
let backend;

function startBackend() {
  if (backend) return;
  backend = spawn(process.env.PYTHON || 'python', [path.join(__dirname, 'backend', 'server.py')], {
    stdio: 'inherit', windowsHide: true,
  });
  backend.on('error', (error) => console.error('Salon API:', error.message));
  backend.on('close', () => { backend = undefined; });
}
process.once('exit', () => backend?.kill());

config.server = {
  ...config.server,
  enhanceMiddleware(middleware, server) {
    const nextMiddleware = enhance ? enhance(middleware, server) : middleware;
    return (req, res, next) => {
      if (!req.url.startsWith('/api/')) return nextMiddleware(req, res, next);
      const upstream = http.request({
        hostname: '127.0.0.1', port: 8000, path: req.url, method: req.method, headers: req.headers,
      }, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
      });
      upstream.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') startBackend();
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Сервер тимчасово недоступний' }));
      });
      req.pipe(upstream);
    };
  },
};

module.exports = config;
