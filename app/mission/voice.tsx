import OnMicIcon from '@/assets/icons/OnMicIcon';
import StaticIcon from '@/assets/icons/VolumeIcon';
import { useAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const cover = require('../../assets/images/undrawsecond.png');
export default function voice() {
    const { letter } = useLocalSearchParams<{ letter?: string }>();
    const [play,setPlay] = useState(false);
    const letterAudioPlayer = useAudioPlayer(require("../../assets/sounds/sounda.mp3"));
    const router = useRouter();

     useEffect(() => {
        if (play) {
            const playAudio = async () => {
                try {
                  letterAudioPlayer.seekTo(0);
                  letterAudioPlayer.play();
                } catch (error) {
                  console.error("Error playing audio:", error);
                } finally {
                  setPlay(false);
                }
            };
            playAudio();
        }
    }, [play, letterAudioPlayer]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.letterContainer}>
        <Text style={styles.secondset}>LET'S WRITE</Text>
      </View>
      <TouchableOpacity style={styles.soundbttn} onPress={()=>setPlay(!play)}>
        <StaticIcon size={48} color="#000" />
      </TouchableOpacity>

      <View style={styles.padcontainer}>
        <View style={styles.textContainer}>
          <TouchableOpacity>
            <OnMicIcon color="#E0681D" size={56} />
          </TouchableOpacity>
          <Text style={styles.mainText}>{letter}</Text>
        </View>
        <Text style={styles.tabText}>TAP HERE</Text>
      </View>
      <Image
        source={cover}
        style={{ width: 200, height: 200, resizeMode: "contain" }}
      />
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.finish} onPress={()=>router.push('/dashboard')}>
          <Text style={styles.btnText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    flex: 1,
    display:'flex',
    flexDirection:'column',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
    
  },
  letterContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    flex: 1,
  },
  secondset: {
    color: "#F59E0B",
    fontFamily: "Popins-Regular",
    fontSize: 24,
  },
  padcontainer: {
    width: 314,
    height: 354,
    borderRadius: 61,
    backgroundColor: "#fff",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    // nice cross-platform shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  textContainer:{
    display:'flex',
    flexDirection:'row',
    gap:8,
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  mainText:{
    fontSize:72,
    fontFamily:'Poppins-ExtraBold',
    color:'#ED7E2D',
  },
  tabText:{
    fontSize:24,
    fontFamily:'Popins-Regular',
    color:'#ACA6A6',
  },
  footerContainer: {
    position: 'relative',
    width:'100%',
    display:'flex',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center'
  },
  finish:{
    backgroundColor: 'rgba(255,185,99,0.3)',
    width:316,
    height:44,
    display:'flex',
    justifyContent:'center',
    alignContent:'center',
    alignItems:'center',
    borderRadius:22,
  },
  btnText:{
    fontFamily:'Popins-Regular',
    fontSize:16,
    color:'#E0681D'
  },
  soundbttn:{
    width:'100%',
    display:'flex',
    justifyContent:'flex-end',
    alignContent:'flex-end',
    alignItems:'flex-end',

  }
});