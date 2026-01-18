#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting CataHouse deployment...');

try {
  // Step 1: Build frontend
  console.log('📦 Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  
  // Step 2: Copy assets to root
  console.log('📁 Copying assets to root...');
  
  const distPath = path.join(__dirname, '../frontend/dist');
  const rootPath = path.join(__dirname, '..');
  
  // Copy index.html
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    fs.copyFileSync(
      path.join(distPath, 'index.html'),
      path.join(rootPath, 'index.html')
    );
    console.log('✅ index.html copied to root');
  }
  
  // Copy assets folder
  const assetsPath = path.join(distPath, 'assets');
  const rootAssetsPath = path.join(rootPath, 'assets');
  
  if (fs.existsSync(assetsPath)) {
    // Remove existing assets folder
    if (fs.existsSync(rootAssetsPath)) {
      fs.rmSync(rootAssetsPath, { recursive: true, force: true });
    }
    
    // Copy new assets folder
    fs.cpSync(assetsPath, rootAssetsPath, { recursive: true });
    console.log('✅ assets/ folder copied to root');
    
    // List copied files
    const files = fs.readdirSync(rootAssetsPath);
    console.log(`📋 Assets copied: ${files.join(', ')}`);
  }
  
  // Step 3: Verify files
  console.log('\n🔍 Verifying deployment files...');
  const rootFiles = fs.readdirSync(rootPath);
  const hasIndex = rootFiles.includes('index.html');
  const hasAssets = rootFiles.includes('assets');
  
  if (hasIndex && hasAssets) {
    console.log('✅ Deployment successful!');
    console.log('🚀 Ready for SFTP upload');
    console.log('💡 Save any file in VSCode to trigger automatic SFTP upload');
  } else {
    console.log('❌ Deployment failed - missing files');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 