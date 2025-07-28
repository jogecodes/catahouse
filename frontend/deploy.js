import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SFTP configuration (matching your .vscode/sftp.json)
const config = {
  host: 'access-5018272229.webspace-host.com',
  port: 22,
  username: 'a832137',
  password: '%Lbm?$VsL*Yxwm2',
  remotePath: '/dev/'
};

const client = new Client();

console.log('🚀 Starting deployment...');

client.on('ready', () => {
  console.log('✅ Connected to IONOS');
  
  client.sftp((err, sftp) => {
    if (err) {
      console.error('❌ SFTP error:', err);
      client.end();
      return;
    }

    const filesToUpload = [
      { local: '../index.html', remote: 'index.html' },
      { local: '../assets', remote: 'assets', isDir: true },
      { local: '../.htaccess', remote: '.htaccess' }
    ];

    let uploadedCount = 0;
    const totalFiles = filesToUpload.length;

    const uploadNext = (index) => {
      if (index >= filesToUpload.length) {
        console.log('🎉 Deployment complete!');
        client.end();
        return;
      }

      const file = filesToUpload[index];
      const localPath = path.resolve(__dirname, file.local);
      const remotePath = config.remotePath + file.remote;

      if (!fs.existsSync(localPath)) {
        console.log(`⚠️  Skipping ${file.local} (not found)`);
        uploadNext(index + 1);
        return;
      }

      if (file.isDir) {
        // Upload directory recursively
        uploadDirectory(localPath, remotePath, () => {
          console.log(`✅ Uploaded directory: ${file.remote}`);
          uploadNext(index + 1);
        });
      } else {
        // Upload single file
        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            console.error(`❌ Failed to upload ${file.local}:`, err);
          } else {
            console.log(`✅ Uploaded: ${file.remote}`);
          }
          uploadNext(index + 1);
        });
      }
    };

    const uploadDirectory = (localDir, remoteDir, callback) => {
      sftp.mkdir(remoteDir, (err) => {
        if (err && err.code !== 4) { // 4 = directory already exists
          console.error(`❌ Failed to create directory ${remoteDir}:`, err);
          callback();
          return;
        }

        fs.readdir(localDir, (err, files) => {
          if (err) {
            console.error(`❌ Failed to read directory ${localDir}:`, err);
            callback();
            return;
          }

          let uploadedFiles = 0;
          const totalFiles = files.length;

          if (totalFiles === 0) {
            callback();
            return;
          }

          files.forEach(file => {
            const localPath = path.join(localDir, file);
            const remotePath = remoteDir + '/' + file;
            const stat = fs.statSync(localPath);

            if (stat.isDirectory()) {
              uploadDirectory(localPath, remotePath, () => {
                uploadedFiles++;
                if (uploadedFiles === totalFiles) {
                  callback();
                }
              });
            } else {
              sftp.fastPut(localPath, remotePath, (err) => {
                if (err) {
                  console.error(`❌ Failed to upload ${localPath}:`, err);
                }
                uploadedFiles++;
                if (uploadedFiles === totalFiles) {
                  callback();
                }
              });
            }
          });
        });
      });
    };

    uploadNext(0);
  });
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err);
});

client.connect(config); 