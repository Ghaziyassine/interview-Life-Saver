@echo off
echo Building window-utils native addon...

cd native-addon\window-utils


echo Installing dependencies with compatibility flags...
call npm install --legacy-peer-deps

echo Building with npm run rebuild...
call npm run rebuild
if %ERRORLEVEL% EQU 0 (
    echo Successfully built native addon!
    echo Copying built addon to project directory...
    xcopy /y .\build\Release\window-utils.node ..\..\build\ 2>nul
    
    cd ..\..
    
    echo Cleaning up problematic directories...
    if exist node_modules\@typescript-eslint\eslint-plugin rmdir /s /q node_modules\@typescript-eslint\eslint-plugin 2>nul
    if exist node_modules\@eslint rmdir /s /q node_modules\@eslint 2>nul
    if exist node_modules\@humanfs rmdir /s /q node_modules\@humanfs 2>nul
    
    echo Updating project dependencies with compatibility flags...
    call npm install --legacy-peer-deps --force
    
    echo Done! Native addon was built successfully.
    echo Check the addon at: build\window-utils.node
) else (
    echo Build failed.
    echo You may need to install additional development dependencies:
    echo 1. Make sure you have Visual Studio 2019 Build Tools installed (https://visualstudio.microsoft.com/vs/older-downloads/)
    echo 2. In the Visual Studio Installer, install the "Desktop development with C++" workload
    echo 3. Make sure you have CMake installed (https://cmake.org/download/)
    cd ..\..
)
