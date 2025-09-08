import HomeIcon from '@/assets/icons/HomeIcon'
import StaticHeartIcon from '@/assets/icons/MeterIcon'
import MuteIcon from '@/assets/icons/MuteIcon'
import StaticIcon from '@/assets/icons/VolumeIcon'
import { usePathname, useRouter } from 'expo-router'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface FooterButtonProps {
    setMute: any;
    mute: Boolean;
    
    isEraser: Boolean;
    undo: () => void;
    clear: () => void;
}

const FooterButton = ({
    setMute,
    mute,
    
    
    undo,
    clear
}: FooterButtonProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const isMissionPage = pathname.includes('/mission') || pathname.includes('/drawing') || pathname.includes('/index');
    const [colorDisable,setColorDisable] = useState(true);
    const [eraseDisable,setEraceDisable] = useState(true); 
    useEffect(()=>{
        if (isMissionPage) {
          setColorDisable(false);
          setEraceDisable(false);
        } else {
          setColorDisable(true);
          setEraceDisable(true);
        }
    },[isMissionPage]);
   

   

    return (
        <View style={styles.bttn}>
            <TouchableOpacity onPress={() => router.push('/home')}>
                <HomeIcon size={32} color="#E0681D" />
            </TouchableOpacity>
            
            {/* <TouchableOpacity
                disabled={colorDisable}
                onPress={handleColorPress}
                style={colorDisable ? styles.disabled : null}
            >
                <Paint
                    size={32}
                    color={colorDisable ? "#999" : "#E0681D"}
                />
            </TouchableOpacity>
            
            <TouchableOpacity
                disabled={eraseDisable}
                onPress={handleErasePress}
                style={[
                    eraseDisable ? styles.disabled : null,
                    isEraser && !eraseDisable ? styles.active : null
                ]}
            >
                <EraceIcon
                    size={32}
                    color={eraseDisable ? "#999" : (isEraser ? "#FF6B6B" : "#E0681D")}
                />
            </TouchableOpacity> */}
            
            <TouchableOpacity onPress={() => router.push('./dashboard')}>
                <StaticHeartIcon size={32} color="#E0681D" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setMute(!mute)}>
                {mute === true ? 
                    <MuteIcon size={32} color="#E0681D" /> : 
                    <StaticIcon size={32} color="#E0681D" />
                }
            </TouchableOpacity>
        </View>
    )
}

export default FooterButton

const styles = StyleSheet.create({
    bttn: {
        backgroundColor: 'rgba(255,185,99,0.3)',
        display: "flex",
        flexDirection: "row",
        gap: 8,
        width: 316,
        height: 44,
        borderRadius: 29,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    disabled: {
        opacity: 0.5,
    },
    active: {
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        borderRadius: 16,
        padding: 4,
    }
});