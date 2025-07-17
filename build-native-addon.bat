@echo off
echo Building window-utils native addon...

cd native-addon\window-utils

echo Installing dependencies...
call npm install

echo Building with npm run rebuild...
call npm run rebuild
if %ERRORLEVEL% EQU 0 (
    echo Successfully built native addon!
    cd ..\..
    echo Updating project dependencies...
    npm install
    echo Done!
) else (
    echo Build failed.
    echo You may need to install additional development dependencies:
    echo 1. Make sure you have Visual Studio 2019 Build Tools installed (https://visualstudio.microsoft.com/vs/older-downloads/)
    echo 2. In the Visual Studio Installer, install the "Desktop development with C++" workload
    echo 3. Make sure you have CMake installed (https://cmake.org/download/)
    cd ..\..
)
