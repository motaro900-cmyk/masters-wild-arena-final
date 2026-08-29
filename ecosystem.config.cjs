/**
 * @owner: @Motaro900 / Backend Team
 * @purpose: PM2 configuration file for managing the Node.js Express server process on a VPS.
 */

module.exports = {
  apps: [
    {
      name: 'masters-wild-arena',
      script: 'server/vps-server.js',
      instances: 1,                // Run in single-process mode for in-memory mutex & atomic JSON storage safety
      exec_mode: 'fork',
      autorestart: true,           // Autorestart on crash
      watch: false,                // Do not watch files in production
      max_memory_restart: '500M',  // Restart if memory exceeds 500MB
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
