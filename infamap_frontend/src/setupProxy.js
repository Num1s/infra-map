const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://192.168.1.93:8000',
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