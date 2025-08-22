import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const ProgressBar = ({
  progress = 20, 
  width = 248,
  height = 30,
  backgroundColor = '#ACA6A6',
  progressColor = '#F59E0B',
  borderRadius=16,
  animated = true,
  duration = 500,
  showPercentage = true,
  textColor = '#333',
  textStyle = {},
  style = {},
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const calculatedBorderRadius = borderRadius !== undefined ? borderRadius : height / 2;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: duration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated, duration]);

  const widthInterpolated = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[{ alignItems: 'center', paddingTop:32, paddingBottom:16 }, style]}>
      <View
        style={[
          styles.container,
          {
            width,
            height,
            backgroundColor,
            borderRadius: calculatedBorderRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progress,
            {
              width: widthInterpolated,
              backgroundColor: progressColor,
              borderRadius: calculatedBorderRadius,
            },
          ]}
        />
      </View>
      <Text
            style={ styles.percentageText}
          >
            {Math.round(progress)}%
          </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  progress: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentageText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontFamily:'Popins-Regular',
    color:'#F59E0B'
  },
});

export default ProgressBar;

// Usage Examples:
/*
// Basic usage
<ProgressBar progress={75} />

// Custom styling
<ProgressBar
  progress={60}
  width={300}
  height={20}
  progressColor="#FF6B6B"
  backgroundColor="#F0F0F0"
  borderRadius={10}
  showPercentage={true}
/>

// Without animation
<ProgressBar
  progress={45}
  animated={false}
  progressColor="#007AFF"
/>

// Custom border radius
<ProgressBar
  progress={80}
  width={250}
  height={15}
  borderRadius={5}
  progressColor="linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
/>
*/