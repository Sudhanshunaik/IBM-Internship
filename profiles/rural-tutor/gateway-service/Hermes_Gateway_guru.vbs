' Hermes Agent Gateway - Messaging Platform Integration
Option Explicit
Dim sh, env, existing_pp
Set sh = CreateObject("WScript.Shell")
Set env = sh.Environment("PROCESS")
env.Item("HERMES_HOME") = "C:\Users\sudha\AppData\Local\hermes\profiles\guru"
env.Item("PYTHONIOENCODING") = "utf-8"
env.Item("HERMES_GATEWAY_DETACHED") = "1"
env.Item("VIRTUAL_ENV") = "C:\Users\sudha\AppData\Local\hermes\hermes-agent\venv"
existing_pp = env.Item("PYTHONPATH")
If Len(existing_pp) > 0 Then
  env.Item("PYTHONPATH") = "C:\Users\sudha\AppData\Local\hermes\hermes-agent;C:\Users\sudha\AppData\Local\hermes\hermes-agent\venv\Lib\site-packages;" & existing_pp
Else
  env.Item("PYTHONPATH") = "C:\Users\sudha\AppData\Local\hermes\hermes-agent;C:\Users\sudha\AppData\Local\hermes\hermes-agent\venv\Lib\site-packages"
End If
sh.CurrentDirectory = "C:\Users\sudha\AppData\Local\hermes\profiles\guru"
sh.Run "C:\Users\sudha\AppData\Roaming\uv\python\cpython-3.11.11-windows-x86_64-none\pythonw.exe -m hermes_cli.main --profile guru gateway run", 0, False
