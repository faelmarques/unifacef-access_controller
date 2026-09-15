@echo off
echo ========================================
echo  FACEF - Sistema de Controle de Acesso
echo  Iniciando servicos...
echo ========================================
echo.

cd /d C:\Users\fael\Documents\facef-rfid-access

echo [1/2] Iniciando backend...
pm2 start ecosystem.config.js

echo.
echo [2/2] Salvando configuracao PM2...
pm2 save

echo.
echo ========================================
echo  Servicos iniciados com sucesso!
echo  
echo  Acesse: http://localhost:3001
echo  
echo  Para ver os logs: pm2 logs
echo  Para parar: pm2 stop all
echo  Para reiniciar: pm2 restart all
echo ========================================
echo.
pause
