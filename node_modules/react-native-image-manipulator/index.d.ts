import {RNImageManipulatorResult as ImageResult} from './index';

export declare type RNImageManipulatorResult = ImageResult;

declare const RNImageManipulator: {
  manipulate: (
    uri: string,
    actions: Array<{
      resize?: {width?: number; height?: number};
      rotate?: number;
      flip?: {vertical?: boolean; horizontal?: boolean};
      crop?: {
        originX?: number;
        originY?: number;
        width?: number;
        height?: number;
      };
    }>,
    saveOptions: {
      compress?: number;
      format?: 'jpeg' | 'png';
      base64?: boolean;
    },
  ) => Promise<RNImageManipulatorResult>;
};
export default RNImageManipulator;