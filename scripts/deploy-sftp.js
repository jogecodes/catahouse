#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting CataHouse deployment with SFTP...');

try {
  const rootPath = path.join(__dirname, '..');
  const appPath = path.join(rootPath, 'app');

  // Step 1: Clean previous app build
  console.log('🧹 Cleaning previous /app build...');
  if (fs.existsSync(appPath)) {
    fs.rmSync(appPath, { recursive: true, force: true });
    console.log('🗑️  Removed /app');
  }

  // Step 2: Build frontend into /app
  console.log('📦 Building frontend into /app...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });

  // Step 3: Ensure root index.html landing exists and links to /app
  console.log('📝 Ensuring root index.html landing exists...');
  const landingHtml = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CataHouse</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0b1220;color:#e6e6e6}
      .card{padding:32px;border-radius:12px;background:#121a2b;border:1px solid #1f2a44;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.35)}
      a.button{display:inline-block;margin-top:16px;padding:10px 16px;border-radius:8px;background:#4c8dff;color:#fff;text-decoration:none}
    </style>
    <script>setTimeout(function(){location.href='/app'},3000)</script>
  </head>
  <body>
    <div class="card">
      <h1>CataHouse</h1>
      <p>Redirigiendo a la aplicación…</p>
      <a class="button" href="/app">Ir a la aplicación</a>
    </div>
  </body>
</html>`;
  fs.writeFileSync(path.join(rootPath, 'index.html'), landingHtml);
  console.log('✅ Root landing index.html ready');

  // Step 4: Verify
  console.log('\n🔍 Verifying /app build files...');
  const appFiles = fs.readdirSync(appPath);
  if (!appFiles.includes('index.html') || !appFiles.includes('assets')) {
    throw new Error('Missing app/index.html or app/assets');
  }
  console.log('✅ /app build OK');

  // Step 5: Trigger SFTP upload
  console.log('\n📤 Triggering SFTP upload...');
  const triggerFile = path.join(rootPath, '.deploy-trigger');
  fs.writeFileSync(triggerFile, new Date().toISOString());
  setTimeout(() => {
    if (fs.existsSync(triggerFile)) fs.unlinkSync(triggerFile);
    console.log('✅ Trigger file cleaned up');
  }, 1000);

  console.log('🚀 Ready! Check your domain now.');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 