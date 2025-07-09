cmake_minimum_required(VERSION 3.15)
project(window-utils)

# Enable C++14 standard
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find include directories for Node-API
execute_process(
    COMMAND node -p "require('node-addon-api').include"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

# Add include directories
include_directories(
    ${CMAKE_JS_INC}
    ${NODE_ADDON_API_DIR}
)

# Define Node.js include directory manually if CMAKE_JS_INC is not set
if(NOT DEFINED CMAKE_JS_INC)
    # Try to find node-api headers in multiple possible locations
    set(POSSIBLE_NODE_DIRS 
        "${CMAKE_BINARY_DIR}/../../../.cmake-js/node-x64/${NODE_RUNTIMEVERSION}/include/node"
        "${CMAKE_BINARY_DIR}/../../.cmake-js/node-x64/${NODE_RUNTIMEVERSION}/include/node"
        "${CMAKE_SOURCE_DIR}/../.cmake-js/node-x64/${NODE_RUNTIMEVERSION}/include/node"
        "$ENV{APPDATA}\\npm\\node_modules\\node-addon-api\\node_api.h"
        "$ENV{APPDATA}\\..\\Local\\node-gyp\\Cache\\${NODE_RUNTIMEVERSION}\\include\\node"
        "C:\\Users\\YASSINE\\AppData\\Local\\node-gyp\\Cache\\20.15.0\\include\\node"
    )
    
    foreach(NODE_DIR ${POSSIBLE_NODE_DIRS})
        if(EXISTS "${NODE_DIR}")
            set(NODE_HEADERS_DIR "${NODE_DIR}")
            message(STATUS "Found Node.js headers at ${NODE_HEADERS_DIR}")
            break()
        endif()
    endforeach()
    
    if(NODE_HEADERS_DIR)
        include_directories(${NODE_HEADERS_DIR})
    else()
        message(FATAL_ERROR "Could not find node-api.h. Please check your Node.js installation.")
    endif()
endif()

# Define NAPI_VERSION
add_definitions(-DNAPI_VERSION=3)

# Add source files
file(GLOB SOURCE_FILES "src/*.cc")

# Create shared library target
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

# Set output directory
set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# Add Node.js libraries
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Install
install(TARGETS ${PROJECT_NAME} DESTINATION ${CMAKE_SOURCE_DIR})
