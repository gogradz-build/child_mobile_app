import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';
const cover = require('../assets/images/cover.png');

const { width, height } = Dimensions.get('window');

const Splash = () => {
  const router = useRouter();
  const message = 'Learn & draw the alphabet with fun!';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/home' as any); 
    }, 5000); 

    return () => clearTimeout(timer); 
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <LinearGradient
      colors={['#FFDEE9', '#B5FFFC']} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.welcomeText}>ABC Dooble</Text>
      <Animatable.Image 
        source={cover} 
        style={styles.img} 
        animation="fadeInUp" 
        iterationCount={1} 
        duration={2000} 
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {message.split('').map((char, index) => (
          <Animatable.Text
            key={index}
            style={styles.text}
            animation="bounceIn"
            delay={index * 100} 
            iterationCount={1}
            duration={600} 
          >
            {char}
          </Animatable.Text>
        ))}
      </View>
    </LinearGradient>
    </SafeAreaView>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    margin: 0,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 32,
    color: '#FFD369',
  },
  text: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins-LightItalic',
    paddingTop: 24,
  },
  img: {
    width: 220,
    height: 265,
    objectFit: 'cover',
    resizeMode: 'contain',
    paddingBottom: 20,
  },
});
