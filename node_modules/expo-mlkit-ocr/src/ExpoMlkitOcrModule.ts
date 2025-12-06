import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoMlkitOcrModule extends NativeModule {
    recognizeText(image: string): Promise<string>;
}

export default requireNativeModule<ExpoMlkitOcrModule>('ExpoMlkitOcrModule');
