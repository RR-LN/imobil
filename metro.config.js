const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Zustand's ESM build uses import.meta.env (Vite); Expo web serves a classic
// script where that is a syntax error. Force the CJS middleware entry.
const zustandMiddlewareCjs = path.join(
  __dirname,
  "node_modules",
  "zustand",
  "middleware.js",
);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "zustand/middleware") {
    return { type: "sourceFile", filePath: zustandMiddlewareCjs };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
