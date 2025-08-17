import React from 'react';
import Svg, { G, Mask, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

const StaticHeartIcon: React.FC<IconProps> = ({ size = 24, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Mask id="heartMask" x="0" y="0" width="24" height="24">
        <Path
          d="M5.64 19.36c-3.52-3.51-3.52-9.21 0-12.72c3.51-3.52 9.21-3.52 12.72 0c3.52 3.51 3.52 9.21 0 12.72"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <G transform="rotate(-100 12 13)">
          <Path
            d="M17 13C17 15.7614 14.7614 18 12 18C9.23858 18 7 15.7614 7 13C7 10.2386 12 -2 12 -2C12 -2 17 10.2386 17 13Z"
            fill="#fff"
          />
        </G>
      </Mask>
      <Rect width="24" height="24" fill={color} mask="url(#heartMask)" />
    </Svg>
  );
};

export default StaticHeartIcon;
