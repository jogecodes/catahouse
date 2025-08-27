# 🚀 IONOS Template Setup Guide

This guide explains everything you need to change in this template to make it your own website.

**Current Example Domain:** `catahouse.yourmovietasteprobablysucks.com`

## 📋 **What You Need to Change**

### 1. **Domain & URLs** 🌐

#### `frontend/check-https.js`
```javascript
// Change these URLs to your actual domain
const SITE_URL = 'https://yourdomain.com'; // Line 4
const httpResponse = await fetch(`http://yourdomain.com`, { // Line 18
```

#### `frontend/deploy.js`
```javascript
// Update SFTP connection details for your IONOS hosting
const config = {
  host: 'your-ionos-host.com',        // Line 12
  port: 22,                           // Line 13
  username: 'your-username',          // Line 14
  password: 'your-password',          // Line 15
  remotePath: '/your-remote-path/'    // Line 16
};
```

#### `frontend/src/App.jsx`
```jsx
// Update the title and content
<h1>Your Website Title</h1>      // Line 12
<p>Your website description</p>   // Line 13
```

#### `frontend/index.html`
```html
<!-- Update the title -->
<title>Your Website Name</title>  <!-- Line 6 -->
```

### 2. **Project Information** 📝

#### `frontend/package.json`
```json
{
  "name": "your-website-name",        // Line 2
  "version": "1.0.0",                // Line 4
  // ... rest stays the same
}
```

#### `frontend/README.md`
```markdown
# Your Website Name                    <!-- Line 1 -->
A description of your website...      <!-- Line 3 -->
```

### 3. **PHP Backend Configuration** ⚙️

#### `php-backend/config.php`
```php
// Database configuration (if you need a database)
define('DB_HOST', 'localhost');           // Line 3
define('DB_NAME', 'your_database_name');  // Line 4
define('DB_USER', 'your_database_user');  // Line 5
define('DB_PASS', 'your_database_password'); // Line 6

// API configuration
define('API_NAME', 'Your Website API');   // Line 9

// CORS configuration - restrict to your domain in production
define('ALLOWED_ORIGINS', ['https://yourdomain.com']); // Line 12
```

#### `php-backend/.htaccess`
```apache
# Uncomment and update if you have SSL
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Update error page paths if needed
ErrorDocument 404 /php-backend/404.php    # Line 25
ErrorDocument 500 /php-backend/500.php    # Line 26
```

### 4. **Build & Deploy Configuration** 🛠️

#### `frontend/vite.config.js`
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',           // Line 8 - where build files go
    assetsDir: 'assets',      // Line 9 - where assets go
  }
})
```

#### `frontend/tailwind.config.cjs`
```javascript
module.exports = {
  content: [
    "./index.html",           // Line 4 - update if you change file structure
    "./src/**/*.{js,ts,jsx,tsx}", // Line 5
  ],
  theme: {
    extend: {
      // Add your custom colors, fonts, etc. here
      colors: {
        'primary': '#your-color',
        'secondary': '#your-color'
      }
    },
  },
  plugins: [],
}
```

## 🔧 **Step-by-Step Setup Process**

### **Step 1: Update Basic Information**
1. Change all domain references from `yourdomain.com` to your actual domain
2. Update website titles and names in HTML/JSX files
3. Update project name in `package.json`

### **Step 2: Configure IONOS Hosting**
1. Get your IONOS SFTP credentials from your hosting control panel
2. Update `deploy.js` with your actual hosting details
3. Test the connection with `npm run check-https`

### **Step 3: Customize Content**
1. Replace the "Hello World" content in `App.jsx` with your actual content
2. Update the `ProgressBar.jsx` component or replace it with your own
3. Customize the CSS in `App.css` and `index.css`

### **Step 4: PHP Backend Setup**
1. Update database credentials in `config.php` if you need a database
2. Modify the example API endpoints in `example-api.php`
3. Update the other PHP files with your actual logic
4. Test your PHP endpoints

### **Step 5: Build & Deploy**
1. Run `npm install` to install dependencies
2. Run `npm run build` to test the build process
3. Run `npm run build:deploy` to deploy to your IONOS hosting

## 🚨 **Security Considerations**

### **Before Going Live:**
- ✅ Change default passwords
- ✅ Restrict CORS origins to your actual domain
- ✅ Enable HTTPS (IONOS usually provides this)
- ✅ Remove or secure any test/example endpoints
- ✅ Update `.htaccess` security headers as needed

### **Production Checklist:**
- [ ] All hardcoded domains updated
- [ ] SFTP credentials updated
- [ ] Database credentials secured
- [ ] CORS origins restricted
- [ ] HTTPS enforced
- [ ] Error pages configured
- [ ] Security headers enabled

## 📚 **Useful Commands**

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Deployment
npm run build:deploy     # Build and deploy to IONOS
npm run check-https      # Verify HTTPS setup

# Code Quality
npm run lint             # Run ESLint
```

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **Build fails** → Check if all dependencies are installed (`npm install`)
2. **Deploy fails** → Verify SFTP credentials in `deploy.js`
3. **HTTPS issues** → Check IONOS SSL configuration
4. **CORS errors** → Update `ALLOWED_ORIGINS` in `config.php`

### **Need Help?**
- Check the browser console for JavaScript errors
- Check the server error logs for PHP issues
- Verify all file paths and permissions
- Test with a simple "Hello World" first

---

## 🎯 **Quick Start Checklist**

- [ ] Update domain references
- [ ] Change website titles
- [ ] Update IONOS credentials
- [ ] Customize content
- [ ] Test locally (`npm run dev`)
- [ ] Test build (`npm run build`)
- [ ] Deploy (`npm run build:deploy`)
- [ ] Verify live site

**Happy coding! 🚀** 