const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of lodash modules
config.resolver.alias = {
  ...config.resolver.alias,
  'lodash/isequal': require.resolve('lodash/isequal'),
  'lodash/isEqual': require.resolve('lodash/isEqual'),
};

module.exports = config;
