import ProgressBar from '@/components/SimpleProgressBar';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const cover = require('../../assets/images/undrawfamily.png');
const index = () => {
 const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.letterContainer}>
        <Text style={styles.secondset}>PROGRESS</Text>
        <Image
          source={cover}
          style={{ width: 200, height: 200, resizeMode: "contain" }}
        />
        <View style={styles.contentCard}>
          <ProgressBar />
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: 248,
            }}
          >
            <Text style={styles.resultText}>Lesson 1</Text>
            <Text style={styles.resultText}>78%</Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: 248,
            }}
          >
            <Text style={styles.resultText}>Lesson 2</Text>
            <Text style={styles.resultText}>78%</Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: 248,
              marginBottom:16,
            }}
          >
            <Text style={styles.resultText}>Lesson 3</Text>
            <Text style={styles.resultText}>78%</Text>
          </View>
        </View>
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.finish}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.btnText}>Back to Lessons</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default index
const styles = StyleSheet.create({
  container:{
    display:'flex',
    flexDirection:'column',
    width:'100%',
    height:'100%',
    alignItems:'center',
    padding:16,
    backgroundColor:'#ffffff'
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
    paddingBottom:24,
  },
  contentCard:{
    marginTop:32,
    width: 322,
    height: 350,
    borderRadius: 61,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems:'center'
  },
  resultText:{
    color:'#ACA6A6',
    fontFamily:'Poppins-Regular',   
    fontSize:24 
  },
  footerContainer: {
    width:'100%',
    display:'flex',
    justifyContent:'center',
    alignContent:'flex-end',
    alignItems:'center',
    marginTop:32,
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
})