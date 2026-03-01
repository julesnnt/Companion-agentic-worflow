@echo off
:: COMPANION — Demo Launcher
:: Lance start.ps1 via PowerShell (contourne les restrictions d'execution)

PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

:: Si PowerShell echoue completement, afficher l'erreur
if errorlevel 1 (
    echo.
    echo  [ERREUR] Le lancement a echoue. Voir le message ci-dessus.
    pause
)
