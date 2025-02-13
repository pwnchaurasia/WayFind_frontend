import { View, Text, StyleSheet, Image } from 'react-native';
import imagePath from '@/src/constants/imagePath';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Image source={imagePath.react_logo}/>
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
