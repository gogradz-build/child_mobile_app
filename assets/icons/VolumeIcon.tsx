import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

const StaticIcon: React.FC<IconProps> = ({ size = 24, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G fill={color}>
        <Path d="M14 3.23c4 0.91 7 4.49 7 8.77c0 4.28-3 7.86-7 8.77v-2.07c2.89-0.86 5-3.53 5-6.7c0-3.17-2.11-5.85-5-6.71Z" />
        <Path d="M14 16c1.5-0.71 2.5-2.24 2.5-4c0-1.77-1-3.26-2.5-4Z" />
      </G>
      <Path
        d="M4 10h3.5l3.5-3.5v10.5l-3.5-3.5h-3.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default StaticIcon;
