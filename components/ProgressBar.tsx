import { View } from 'react-native';

export default function ProgressBar({ value }: { value: number }) {
  return (
    <View style={{ 
      height: 8, 
      backgroundColor: '#1f2937', 
      borderRadius: 999 
    }}>
      <View style={{
        width: `${Math.min(Math.max(value, 0), 100)}%`,
        height: '100%', 
        backgroundColor: '#a3e635', 
        borderRadius: 999
      }}/>
    </View>
  );
}
