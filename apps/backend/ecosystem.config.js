module.exports = {
  apps: [
    {
      name: 'edge-backend-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ENABLE_AUTO_BOTS: 'true'
      }
    }
  ]
};
