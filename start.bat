@echo off
echo ========================================
echo   在线测验系统 - 启动脚本
echo ========================================
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    echo.
)

echo 启动开发服务器...
echo 浏览器将自动打开 http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.
call npm run dev

pause




