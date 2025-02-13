import { View, Text, StyleSheet, Image } from 'react-native';
import imagePath from '@/src/constants/imagePath';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={{'fontFamily': 'Poppins_700Bold'}}>Home</Text>
      <Image source={imagePath.icon}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
