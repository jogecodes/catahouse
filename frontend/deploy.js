import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Client } = require('ssh2');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// SFTP configuration for catahouse.yourmovietasteprobablysucks.com
const config = {
  host: 'access-5018272229.webspace-host.com',
  port: 22,
  username: 'a832137',
  password: '%Lbm?$VsL*Yxwm2',
  remotePath: '/'
};

const client = new Client();

function log(...args) { console.log(...args); }
function err(...args) { console.error(...args); }

log('🚀 Iniciando despliegue a catahouse.yourmovietasteprobablysucks.com...');

client.on('ready', () => {
  log('✅ Conectado a IONOS');
  client.sftp((sftpErr, sftp) => {
    if (sftpErr) {
      err('❌ Error SFTP:', sftpErr);
      client.end();
      return;
    }

    const remoteAssets = config.remotePath + 'assets';
    const remoteBackend = config.remotePath + 'php-backend';
    const filesToUpload = [
      { local: path.resolve(__dirname, '../public'), remote: config.remotePath + 'public', isDir: true },
      { local: path.resolve(__dirname, '../assets'), remote: config.remotePath + 'assets', isDir: true },
      { local: path.join(projectRoot, 'php-backend'), remote: config.remotePath + 'php-backend', isDir: true },
      { local: path.resolve(__dirname, '../index.html'), remote: config.remotePath + 'index.html' }
    ];

    const ensureRemoteDir = (dir, cb) => {
      const parts = dir.replace(/\\+/g, '/').split('/').filter(Boolean);
      let built = dir.startsWith('/') ? '/' : '';
      const next = (i) => {
        if (i >= parts.length) return cb();
        built += (built.endsWith('/') ? '' : '/') + parts[i];
        sftp.mkdir(built, (mkErr) => {
          // Ignore if exists or generic failure
          next(i + 1);
        });
      };
      next(0);
    };

    const removeRemoteDir = (dir, cb) => {
      sftp.readdir(dir, (rdErr, list) => {
        if (rdErr) {
          // If it doesn't exist, that's fine
          return cb();
        }
        let pending = list.length;
        if (!pending) return sftp.rmdir(dir, () => cb());
        list.forEach((entry) => {
          const p = dir + '/' + entry.filename;
          const type = entry.longname && entry.longname[0];
          if (type === 'd') {
            removeRemoteDir(p, () => {
              sftp.rmdir(p, () => { if (!--pending) sftp.rmdir(dir, () => cb()); });
            });
          } else {
            sftp.unlink(p, () => { if (!--pending) sftp.rmdir(dir, () => cb()); });
          }
        });
      });
    };

    const uploadFile = (localPath, remotePath, cb) => {
      sftp.fastPut(localPath, remotePath, (putErr) => {
        if (putErr) err(`❌ Error subiendo archivo ${localPath} → ${remotePath}:`, putErr);
        else log(`✅ Archivo subido: ${remotePath}`);
        cb();
      });
    };

    const uploadDirectory = (localDir, remoteDir, cb) => {
      ensureRemoteDir(remoteDir, () => {
        fs.readdir(localDir, (readErr, entries) => {
          if (readErr) {
            err(`❌ No se pudo leer el directorio local ${localDir}:`, readErr);
            cb();
            return;
          }
          if (!entries || entries.length === 0) return cb();
          let done = 0;
          const next = () => { if (++done === entries.length) cb(); };
          entries.forEach((name) => {
            const lp = path.join(localDir, name);
            const rp = remoteDir + '/' + name;
            const st = fs.statSync(lp);
            if (st.isDirectory()) {
              uploadDirectory(lp, rp, next);
            } else {
              uploadFile(lp, rp, next);
            }
          });
        });
      });
    };

    let index = 0;
    const uploadNext = () => {
      if (index >= filesToUpload.length) {
        log('🎉 Despliegue completado.');
        log('🌐 Sitio: https://catahouse.yourmovietasteprobablysucks.com');
        log('🔧 Backend: https://catahouse.yourmovietasteprobablysucks.com/php-backend/');
        client.end();
        return;
      }
      const file = filesToUpload[index++];
      if (!fs.existsSync(file.local)) {
        log(`⚠️  Omitido (no existe): ${file.local}`);
        uploadNext();
        return;
      }
      if (file.isDir) {
        const doUpload = () => {
          log(`📁 Subiendo directorio: ${file.local} → ${file.remote}`);
          uploadDirectory(file.local, file.remote, uploadNext);
        };
        if (file.cleanBefore) {
          log(`🧹 Limpiando remoto: ${file.remote}`);
          removeRemoteDir(file.remote, () => ensureRemoteDir(file.remote, doUpload));
        } else {
          doUpload();
        }
      } else {
        log(`📄 Subiendo archivo: ${file.local} → ${file.remote}`);
        const dirName = path.posix.dirname(file.remote.replace(/\\/g, '/'));
        ensureRemoteDir(dirName, () => uploadFile(file.local, file.remote, uploadNext));
      }
    };

    uploadNext();
  });
});

client.on('error', (e) => {
  err('❌ Error de conexión:', e);
});

client.on('end', () => log('🔌 Conexión cerrada'));
client.on('close', () => log('🔒 Sesión finalizada'));

client.connect(config); 