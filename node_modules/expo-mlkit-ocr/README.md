# Expo ML Kit OCR

Text recognition for React Native using native OCR engines.

- **Android**: Google ML Kit
- **iOS**: Apple Vision Framework

## Installation

```bash
npm install expo-mlkit-ocr
```

Requires `expo-modules-core`.

## Usage

```typescript
import ExpoMlkitOcr from 'expo-mlkit-ocr';

const result = await ExpoMlkitOcr.recognizeText('file:///path/to/image.jpg');
console.log(result.text);

// Log each block
result.blocks.forEach((block, blockIndex) => {
  console.log(`Block ${blockIndex}:`, block.text);
  
  // Log each line in the block
  block.lines.forEach((line, lineIndex) => {
    console.log(`  Line ${lineIndex}:`, line.text);
    
    // Log each element in the line
    line.elements.forEach((element, elementIndex) => {
      console.log(`    Element ${elementIndex}:`, element.text);
    });
  });
});
```

## API

### `recognizeText(imageUri: string)`

Returns:
```typescript
{
  text: string;
  blocks: Array<{
    text: string;
    lines: Array<{
      text: string;
      elements: Array<{
        text: string;
        cornerPoints: Array<{x: number, y: number}>;
      }>;
      cornerPoints: Array<{x: number, y: number}>;
    }>;
    cornerPoints: Array<{x: number, y: number}>;
  }>;
}
```

## Requirements

- iOS 13.0+
- Android API 21+

## License

MIT