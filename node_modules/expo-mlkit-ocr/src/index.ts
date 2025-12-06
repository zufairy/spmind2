import { requireNativeModule } from 'expo-modules-core'
import type { ExpoMlkitOcrModule } from './ExpoMlkitOcr.types'

const ExpoMlkitOcr = requireNativeModule<ExpoMlkitOcrModule>('ExpoMlkitOcr')

export default ExpoMlkitOcr
export * from './ExpoMlkitOcr.types'