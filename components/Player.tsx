import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { 
  VISIBLE_W, 
  VISIBLE_H, 
  SCALE, 
  FRAME_W, 
  FRAME_H, 
  SPRITE_COLS, 
  SPRITE_ROWS,
  rowFromDir 
} from '../movement/grid';
import { Player as PlayerType } from '../animation/spriteAnimator';

interface PlayerProps {
  player: PlayerType;
  spriteSource: any; // Image source
}

export const Player: React.FC<PlayerProps> = ({ player, spriteSource }) => {
  // Calculate draw position (feet anchor)
  const drawX = Math.round(player.pos.x - VISIBLE_W / 2);
  const drawY = Math.round(player.pos.y - VISIBLE_H);

  // Calculate sprite sheet dimensions
  const sheetW = FRAME_W * SPRITE_COLS;
  const sheetH = FRAME_H * SPRITE_ROWS;

  // Calculate frame position in sprite sheet
  const row = rowFromDir(player.dir);
  const col = player.frame;

  // Calculate translation to show the correct frame
  const translateX = -col * FRAME_W * SCALE;
  const translateY = -row * FRAME_H * SCALE;

  return (
    <View
      style={[
        styles.playerContainer,
        {
          left: drawX,
          top: drawY,
          width: VISIBLE_W,
          height: VISIBLE_H,
        },
      ]}
    >
      <Image
        source={spriteSource}
        style={[
          styles.spriteImage,
          {
            width: sheetW * SCALE,
            height: sheetH * SCALE,
            transform: [
              { translateX },
              { translateY },
            ],
          },
        ]}
        resizeMode="stretch"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    position: 'absolute',
    overflow: 'hidden', // Clip to show only one frame
    justifyContent: 'center',
    alignItems: 'center',
  },
  spriteImage: {
    // Image will be translated to show correct frame
  },
});
