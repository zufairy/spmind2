import { NativeModules } from "react-native";

const { RNImageManipulator } = NativeModules;

export type RNImageManipulatorResult = {
    uri: string;
    width: number;
    height: number;
    base64?: string;
};

export default RNImageManipulator;
