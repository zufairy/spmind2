import { Text, View } from 'react-native';

export default function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{
      backgroundColor: color, 
      paddingHorizontal: 10, 
      paddingVertical: 6,
      borderRadius: 999, 
      alignSelf: 'flex-start'
    }}>
      <Text style={{ 
        color: '#0a0a0a', 
        fontWeight: '700', 
        fontSize: 12 
      }}>
        {text}
      </Text>
    </View>
  );
}
