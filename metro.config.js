const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of lodash modules
config.resolver.alias = {
  ...config.resolver.alias,
  'lodash/isequal': require.resolve('lodash/isequal'),
  'lodash/isEqual': require.resolve('lodash/isEqual'),
};

// Exclude problematic packages that use import.meta from web builds
<<<<<<< Updated upstream
// Handle blockList which can be undefined, a RegExp, or an array
const existingBlockList = config.resolver.blockList;
const blockListArray = existingBlockList
  ? Array.isArray(existingBlockList)
    ? existingBlockList
    : [existingBlockList]
  : [];

config.resolver.blockList = [
  ...blockListArray,
=======
const existingBlockList = Array.isArray(config.resolver.blockList) 
  ? config.resolver.blockList 
  : [];
config.resolver.blockList = [
  ...existingBlockList,
>>>>>>> Stashed changes
  // Block debugger-frontend which uses import.meta and causes web build issues
  /node_modules\/@react-native\/debugger-frontend\/.*/,
];

module.exports = config;
