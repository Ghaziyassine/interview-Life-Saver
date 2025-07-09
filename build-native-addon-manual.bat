@echo off
echo Building window-utils native addon...

cd native-addon\window-utils

echo Installing dependencies...
call npm install

echo Creating build directory...
if not exist "build" mkdir build
cd build

echo Configuring CMake...
cmake .. -G "Visual Studio 16 2019" -A x64

IF %ERRORLEVEL% NEQ 0 (
    echo Error: CMake configuration failed
    cd ..\..\..\
    exit /b %ERRORLEVEL%
)

echo Building native addon...
cmake --build . --config Release

IF %ERRORLEVEL% NEQ 0 (
    echo Error: Build failed
    cd ..\..\..\
    exit /b %ERRORLEVEL%
)

echo Copying output files...
if not exist "..\build" mkdir ..\build
copy /Y "Release\window-utils.node" "..\window-utils.node"

cd ..\..\..\
echo Done building native addon!
