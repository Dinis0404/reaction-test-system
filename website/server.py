#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的HTTP服务器，用于启动网站
"""
import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

# 设置端口
PORT = 8000

# 切换到脚本所在目录
os.chdir(Path(__file__).parent)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义请求处理器"""
    
    def end_headers(self):
        # 添加CORS头部（如果需要）
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[服务器] {args[0]}")

def start_server():
    """启动HTTP服务器"""
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("=" * 50)
            print(f"🚀 服务器已启动!")
            print(f"📡 地址: http://localhost:{PORT}")
            print(f"📂 目录: {os.getcwd()}")
            print("=" * 50)
            print("按 Ctrl+C 停止服务器")
            print("=" * 50)
            
            # 自动打开浏览器
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🌐 浏览器已自动打开")
            except:
                print("⚠️  无法自动打开浏览器，请手动访问上述地址")
            
            # 启动服务器
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 98 or e.errno == 48:  # Address already in use
            print(f"❌ 错误: 端口 {PORT} 已被占用")
            print(f"💡 提示: 请关闭占用该端口的程序，或修改 PORT 变量使用其他端口")
        else:
            print(f"❌ 错误: {e}")
    except KeyboardInterrupt:
        print("\n" + "=" * 50)
        print("🛑 服务器已停止")
        print("=" * 50)

if __name__ == "__main__":
    start_server()




