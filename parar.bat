@echo off
echo ========================================
echo  FACEF - Parando servicos...
echo ========================================
echo.

pm2 stop all
pm2 delete all

echo.
echo  Servicos parados com sucesso!
echo.
pause
