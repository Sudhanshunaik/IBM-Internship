@echo off
rem Hermes Agent Gateway - Messaging Platform Integration
cd /d C:\Users\sudha\AppData\Local\hermes\profiles\guru
set "HERMES_HOME=C:\Users\sudha\AppData\Local\hermes\profiles\guru"
set "PYTHONIOENCODING=utf-8"
set "HERMES_GATEWAY_DETACHED=1"
set "VIRTUAL_ENV=C:\Users\sudha\AppData\Local\hermes\hermes-agent\venv"
set "PYTHONPATH=C:\Users\sudha\AppData\Local\hermes\hermes-agent;C:\Users\sudha\AppData\Local\hermes\hermes-agent\venv\Lib\site-packages;%PYTHONPATH%"
C:\Users\sudha\AppData\Roaming\uv\python\cpython-3.11.11-windows-x86_64-none\pythonw.exe -m hermes_cli.main --profile guru gateway run
exit /b 0
