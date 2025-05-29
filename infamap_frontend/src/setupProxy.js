const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.168.0.36:3001/api/v1/',
      changeOrigin: true,
      logLevel: 'debug',
      onError: function (err, req, res) {
        console.log('Proxy Error:', err);
      },
      onProxyReq: function (proxyReq, req, res) {
        console.log('Proxy Request:', req.method, req.url);
      },
      onProxyRes: function (proxyRes, req, res) {
        console.log('Proxy Response:', proxyRes.statusCode, req.url);
      }
    })
  );
}; 