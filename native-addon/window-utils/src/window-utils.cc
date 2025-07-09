#include <napi.h>

#ifdef _WIN32
#include <windows.h>

// Define Windows 10 constants if not already defined
#ifndef WDA_NONE
#define WDA_NONE 0
#endif

#ifndef WDA_MONITOR
#define WDA_MONITOR 1
#endif

#ifndef WDA_EXCLUDEFROMCAPTURE
#define WDA_EXCLUDEFROMCAPTURE 2
#endif
#endif

Napi::Boolean SetWindowDisplayAffinity(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Check arguments
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Window handle (number) expected as first argument").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }

  // Get the window handle from the first argument
  #ifdef _WIN32
  HWND hwnd = (HWND)static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value());
  
  // Set the window display affinity to exclude from capture
  BOOL result = ::SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
  #else
  // Not supported on non-Windows platforms
  bool result = false;
  #endif
  
  // Return whether the operation was successful
  return Napi::Boolean::New(env, result == TRUE);
}

// Reset window display affinity to normal
Napi::Boolean ResetWindowDisplayAffinity(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Check arguments
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Window handle (number) expected as first argument").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }

  // Get the window handle from the first argument
  #ifdef _WIN32
  HWND hwnd = (HWND)static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value());
  
  // Reset the window display affinity to normal (WDA_NONE = 0)
  BOOL result = ::SetWindowDisplayAffinity(hwnd, 0);
  #else
  // Not supported on non-Windows platforms
  bool result = false;
  #endif
  
  // Return whether the operation was successful
  return Napi::Boolean::New(env, result == TRUE);
}

// Get current window display affinity
Napi::Number GetWindowDisplayAffinity(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Check arguments
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Window handle (number) expected as first argument").ThrowAsJavaScriptException();
    return Napi::Number::New(env, -1);
  }

  // Get the window handle from the first argument
  #ifdef _WIN32
  HWND hwnd = (HWND)static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value());
  
  // Get the current window display affinity
  DWORD affinity = 0;
  BOOL result = ::GetWindowDisplayAffinity(hwnd, &affinity);
  
  if (!result) {
    return Napi::Number::New(env, -1); // Error
  }
  #else
  // Not supported on non-Windows platforms
  int affinity = -1;
  #endif
  
  // Return the affinity value
  return Napi::Number::New(env, static_cast<double>(affinity));
}

// Initialize the module
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Create function templates for our exported functions
  // Define function types for clarity
  typedef Napi::Boolean (*WindowAffinityFunc)(const Napi::CallbackInfo&);
  typedef Napi::Number (*GetAffinityFunc)(const Napi::CallbackInfo&);

  // Cast each function to its appropriate type before passing to Napi::Function::New
  WindowAffinityFunc setFunc = &SetWindowDisplayAffinity;
  WindowAffinityFunc resetFunc = &ResetWindowDisplayAffinity;
  GetAffinityFunc getFunc = &GetWindowDisplayAffinity;

  exports.Set("setWindowDisplayAffinity", Napi::Function::New(env, setFunc));
  exports.Set("resetWindowDisplayAffinity", Napi::Function::New(env, resetFunc));
  exports.Set("getWindowDisplayAffinity", Napi::Function::New(env, getFunc));

  // Export WDA constants (these are the Windows constant values)
  exports.Set("WDA_NONE", Napi::Number::New(env, 0)); // WDA_NONE = 0
  exports.Set("WDA_MONITOR", Napi::Number::New(env, 1)); // WDA_MONITOR = 1
  exports.Set("WDA_EXCLUDEFROMCAPTURE", Napi::Number::New(env, 2)); // WDA_EXCLUDEFROMCAPTURE = 2

  return exports;
}

NODE_API_MODULE(window_utils, Init)
