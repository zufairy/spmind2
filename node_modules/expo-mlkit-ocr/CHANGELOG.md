# Changelog

## [2.0.1] - 2025-06-24

### Fixed
- Re-release after 2.0.0 was unpublished

## [2.0.0] - 2025-06-24 [UNPUBLISHED]

### Added
- iOS support using Apple Vision Framework
- Expo modules architecture for both platforms
- Auto-linking support
- TypeScript definitions

### Changed
- **BREAKING**: Requires `expo-modules-core` as peer dependency
- **BREAKING**: Minimum iOS version 13.0+
- **BREAKING**: Migrated from React Native modules to Expo modules
- **BREAKING**: Package structure updated (entry point now `src/`)

### Migration from v1.x
1. Install `expo-modules-core`
2. Remove any manual linking code
3. Rebuild project

## [1.0.0] - 2025-05-20
- Initial Android-only release with Google ML Kit 