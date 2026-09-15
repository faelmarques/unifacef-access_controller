module.exports = {
  apps: [
    {
      name: 'facef-backend',
      script: './backend/start.js',
      cwd: 'C:\\Users\\fael\\Documents\\facef-rfid-access',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './backend/logs/error.log',
      out_file: './backend/logs/out.log',
      merge_logs: true
    }
  ]
};
