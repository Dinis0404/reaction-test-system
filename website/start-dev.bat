@echo off
chcp 65001 >nul
echo ========================================
echo    在线测验系统 - 启动脚本
echo ========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 设置环境变量（如果 Node.js 在 D:\node）
if exist "D:\node\node.exe" (
    set PATH=D:\node;%PATH%
    echo 已设置 Node.js 路径: D:\node
) else (
    REM 尝试从常见路径查找
    if exist "C:\Program Files\nodejs\node.exe" (
        set PATH=C:\Program Files\nodejs;%PATH%
        echo 已设置 Node.js 路径: C:\Program Files\nodejs
    )
)

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
    echo.
)

echo 启动开发服务器...
echo 浏览器将自动打开 http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.

REM 启动 Next.js 开发服务器
call npm run dev

pause

