@echo off
echo Building window-utils native addon...

cd native-addon\window-utils

echo Installing dependencies...
call npm install

echo Trying multiple build methods...

echo Method 1: Using npm run rebuild...
call npm run rebuild
if %ERRORLEVEL% EQU 0 (
    echo Successfully built with npm run rebuild!
    goto success
)

echo Method 2: Using node-gyp directly...
call npx node-gyp clean
call npx node-gyp configure
call npx node-gyp build
if %ERRORLEVEL% EQU 0 (
    echo Successfully built with node-gyp!
    goto success
)

echo Method 3: Using manual CMake approach...
if not exist "build" mkdir build
cd build
cmake .. -G "Visual Studio 16 2019" -A x64
if %ERRORLEVEL% EQU 0 (
    cmake --build . --config Release
    if %ERRORLEVEL% EQU 0 (
        echo Successfully built with manual CMake!
        copy /Y "Release\window-utils.node" "..\window-utils.node"
        cd ..
        goto success_from_build
    )
)
cd ..

echo All build methods failed.
echo You may need to install additional dependencies:
echo 1. Make sure you have Visual Studio 2019 Build Tools installed
echo 2. Make sure you have the "Desktop development with C++" workload installed
echo 3. Make sure you have CMake installed
echo 4. Try building manually with: npm run build:gyp

goto end

:success_from_build
echo Success! Native addon built successfully.
cd ..\..
goto final

:success
echo Success! Native addon built successfully.
cd ..\..

:final
echo Updating project dependencies...
npm install
echo Done!

:end
