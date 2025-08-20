const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules that might be used by dependencies
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'expo-crypto',
  stream: 'readable-stream',
  url: 'react-native-url-polyfill',
};

// Ensure proper handling of react-native polyfills
config.resolver.platforms = [...config.resolver.platforms, 'native', 'android', 'ios'];

module.exports = config;