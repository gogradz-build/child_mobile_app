import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;   // width & height
  color?: string;  // stroke color
};

const MuteIcon: React.FC<IconProps> = ({ size = 24, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_4418_9568)">
        <Path
          d="M2 10.1599V14.1599C2 16.1599 3 17.1599 5 17.1599H6.43C6.8 17.1599 7.17 17.2699 7.49 17.4599L10.41 19.2899C12.93 20.8699 15 19.7199 15 16.7499V7.56995C15 4.58995 12.93 3.44995 10.41 5.02995L7.49 6.85995C7.17 7.04995 6.8 7.15995 6.43 7.15995H5C3 7.15995 2 8.15995 2 10.1599Z" 
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
d="M22 14.1192L18.04 10.1592"          
stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M21.96 10.1992L18 14.1592"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
      </G>
      <Defs>
        <ClipPath id="clip0_4418_9568">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default MuteIcon;
