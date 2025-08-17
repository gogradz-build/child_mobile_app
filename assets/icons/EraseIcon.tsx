import React from 'react';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;   // width & height
  color?: string;  // stroke color
};

const EraceIcon: React.FC<IconProps> = ({ size = 24, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_4418_9568)">
        <Path
          d="M9 22H21"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M2.90997 17.5807L6.41998 21.0907C7.58998 22.2607 9.49997 22.2607 10.66 21.0907L21.09 10.6607C22.26 9.4907 22.26 7.5807 21.09 6.4207L17.58 2.9107C16.41 1.7407 14.5 1.7407 13.34 2.9107L2.90997 13.3407C1.73997 14.5007 1.73997 16.4107 2.90997 17.5807Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7.12 9.13086L14.87 16.8809"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3.52002 17.66L9.16998 12"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6.34009 20.4901L12.0001 14.8301"
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

export default EraceIcon;
