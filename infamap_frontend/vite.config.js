import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Загружаем конфигурацию доступа
let accessConfig;
try {
  const configPath = path.resolve('./access-config.json');
  accessConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.warn('Не удалось загрузить access-config.json, используем настройки по умолчанию');
  accessConfig = {
    allowedIPs: ['127.0.0.1', '::1', '192.168.1.89', '192.168.1.93', '192.168.1.97'],
    settings: { enableIPCheck: true, logAccess: true, blockUnknownIPs: true }
  };
}

// Функция проверки IP
const isIPAllowed = (clientIP) => {
  if (!accessConfig.settings.enableIPCheck) return true;
  
  return accessConfig.allowedIPs.some(allowedIP => {
    if (clientIP === allowedIP) return true;
    // Поддержка масок подсетей
    if (allowedIP.endsWith('*')) {
      const subnet = allowedIP.slice(0, -1);
      return clientIP?.startsWith(subnet);
    }
    // Поддержка CIDR нотации (базовая)
    if (allowedIP.includes('/')) {
      const [network, mask] = allowedIP.split('/');
      // Упрощенная проверка для /24 подсетей
      if (mask === '24') {
        const networkBase = network.substring(0, network.lastIndexOf('.'));
        const clientBase = clientIP?.substring(0, clientIP.lastIndexOf('.'));
        return networkBase === clientBase;
      }
    }
    return false;
  });
};

// Функция логирования доступа
const logAccess = (clientIP, allowed, userAgent = '') => {
  if (!accessConfig.settings.logAccess) return;
  
  const timestamp = new Date().toISOString();
  const status = allowed ? 'РАЗРЕШЕН' : 'ЗАПРЕЩЕН';
  const logEntry = `[${timestamp}] ${status} - IP: ${clientIP} - UserAgent: ${userAgent}\n`;
  
  try {
    fs.appendFileSync('./access.log', logEntry);
  } catch (error) {
    console.error('Ошибка записи в лог:', error);
  }
};

// Middleware для контроля доступа
const accessControlMiddleware = () => {
  return {
    name: 'access-control',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Получаем IP клиента
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                        req.headers['x-real-ip'] ||
                        req.connection.remoteAddress ||
                        req.socket.remoteAddress ||
                        (req.connection.socket ? req.connection.socket.remoteAddress : null);

        const userAgent = req.headers['user-agent'] || '';
        
        // Очищаем IPv6 localhost
        const cleanIP = clientIP === '::1' ? '127.0.0.1' : 
                       clientIP?.replace('::ffff:', '') || 'unknown';

        console.log(`🌐 Подключение: ${cleanIP} - ${userAgent.substring(0, 50)}...`);

        // Проверяем доступ
        const allowed = isIPAllowed(cleanIP);
        
        // Логируем попытку доступа
        logAccess(cleanIP, allowed, userAgent);

        if (!allowed && accessConfig.settings.blockUnknownIPs) {
          console.log(`❌ Доступ запрещен для IP: ${cleanIP}`);
          
          res.statusCode = 403;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Доступ ограничен - InfraMap</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh; display: flex; align-items: center; justify-content: center;
                        color: #333;
                    }
                    .container { 
                        background: white; padding: 3rem; border-radius: 20px; 
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 500px; text-align: center;
                        animation: slideIn 0.5s ease-out;
                    }
                    @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    .icon { font-size: 4rem; margin-bottom: 1rem; }
                    h1 { color: #e74c3c; margin-bottom: 1rem; font-size: 1.8rem; }
                    p { color: #666; line-height: 1.6; margin-bottom: 1rem; }
                    .ip-info { 
                        background: #f8f9fa; padding: 1rem; border-radius: 10px; 
                        font-family: 'Courier New', monospace; margin: 1.5rem 0;
                        border-left: 4px solid #e74c3c;
                    }
                    .contact { 
                        background: #e3f2fd; padding: 1rem; border-radius: 10px; 
                        border-left: 4px solid #2196f3; margin-top: 1.5rem;
                    }
                    .time { color: #999; font-size: 0.9rem; margin-top: 1rem; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">🔒</div>
                    <h1>Доступ ограничен</h1>
                    <p>Ваше устройство не авторизовано для доступа к системе InfraMap.</p>
                    
                    <div class="ip-info">
                        <strong>Ваш IP-адрес:</strong><br>
                        ${cleanIP}
                    </div>
                    
                    <p>Это приложение предназначено только для авторизованных пользователей.</p>
                    
                    <div class="contact">
                        <strong>📞 Нужен доступ?</strong><br>
                        Обратитесь к системному администратору для добавления вашего IP-адреса в список разрешенных.
                    </div>
                    
                    <div class="time">
                        Время попытки: ${new Date().toLocaleString('ru-RU')}
                    </div>
                </div>
            </body>
            </html>
          `);
          return;
        }

        console.log(`✅ Доступ разрешен для IP: ${cleanIP}`);
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    accessControlMiddleware()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    cors: {
      origin: function (origin, callback) {
        // Разрешаем запросы без origin (например, мобильные приложения)
        if (!origin) return callback(null, true);
        
        // Динамически формируем список разрешенных доменов на основе IP
        const allowedOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          ...accessConfig.allowedIPs
            .filter(ip => !ip.includes('*') && !ip.includes('/'))
            .map(ip => `http://${ip}:3000`)
        ];
        
        if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(':3000', '')))) {
          callback(null, true);
        } else {
          callback(null, true); // Разрешаем все CORS для упрощения
        }
      },
      credentials: true
    },
    proxy: {
      '/api': {
        target: 'http://192.168.1.93:8000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.log('Proxy Error:', err);
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log('Proxy Request:', req.method, req.url);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('Proxy Response:', proxyRes.statusCode, req.url);
          // Добавляем CORS заголовки для всех API запросов
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        }
      }
    }
  }
}) 