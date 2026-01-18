# IONOS Hello World Template

A clean, minimal template for building websites on IONOS hosting with React frontend and PHP backend.

## Features

- **React Frontend**: Modern React 18 with Vite build system
- **PHP Backend**: Ready-to-implement PHP backend structure
- **Build Tools**: Includes useful utilities for deployment and HTTPS checking
- **IONOS Ready**: Optimized for IONOS hosting environment

## Quick Start

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
├── frontend/           # React frontend application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── build tools    # Deployment and utility scripts
├── php-backend/       # PHP backend files
└── index.html         # Main entry point
```

## Build Tools

- **clean-build.js**: Cleans old build files before building
- **check-https.js**: Verifies HTTPS enforcement and security headers
- **deploy.js**: Automated deployment script

## PHP Backend

The `php-backend/` directory contains example PHP files ready for your implementation.

## Deployment

1. Build the frontend: `npm run build`
2. Upload the `dist/` folder and `php-backend/` to your IONOS hosting
3. Configure your domain to point to the uploaded files

## License

MIT License - feel free to use this template for your projects!
