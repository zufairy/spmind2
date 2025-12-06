/**
 * Structure of the text recognition result returned by the ML Kit OCR engine
 */
export interface TextRecognitionResult {
  /** The complete recognized text */
  text: string;
  /** Array of text blocks identified in the image */
  blocks: Array<{
    /** Text content of the block */
    text: string;
    /** Array of text lines within the block */
    lines: Array<{
      /** Text content of the line */
      text: string;
      /** Array of text elements (words) within the line */
      elements: Array<{
        /** Text content of the element */
        text: string;
        /** Corner points of the element in the image */
        cornerPoints: Array<{x: number, y: number}>;
      }>;
      /** Corner points of the line in the image */
      cornerPoints: Array<{x: number, y: number}>;
    }>;
    /** Corner points of the block in the image */
    cornerPoints: Array<{x: number, y: number}>;
  }>;
}

export interface ExpoMlkitOcrModule {
  /**
   * Performs OCR (Optical Character Recognition) on an image
   * @param imageUri - URI of the image to process (file:// protocol)
   * @returns Promise resolving to the text recognition result
   */
  recognizeText(imageUri: string): Promise<TextRecognitionResult>;
}

export type ExpoMlkitOcrModuleEvents = {}