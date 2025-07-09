@echo off
echo Building window-utils native addon using node-gyp...

cd native-addon\window-utils

echo Installing dependencies...
call npm install

echo Building with node-gyp...
call npx node-gyp rebuild

IF %ERRORLEVEL% NEQ 0 (
    echo Error: Build failed
    cd ..\..
    exit /b %ERRORLEVEL%
)

echo Done building native addon with node-gyp!
cd ..\..

echo Updating project dependencies...
npm install

echo Done!
