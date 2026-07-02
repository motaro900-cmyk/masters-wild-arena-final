/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: PM2 configuration file for managing the Node.js Express server process on a VPS.
 */

module.exports = {
  apps: [
    {
      name: 'masters-wild-arena',
      script: 'server/vps-server.js',
      instances: 'max',            // Run in cluster mode utilizing all CPU cores
      exec_mode: 'cluster',
      autorestart: true,           // Autorestart on crash
      watch: false,                // Do not watch files in production
      max_memory_restart: '1G',    // Restart if memory exceeds 1GB
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
