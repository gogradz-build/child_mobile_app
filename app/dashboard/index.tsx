import ProgressBar from '@/components/SimpleProgressBar';
import { useMarks } from '@/context/MarksContext';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const cover = require('../../assets/images/undrawfamily.png');

const Dashboard = () => {
  const router = useRouter();
  const { marks } = useMarks();

  // All letters A-Z
  const lessons = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  const getLessonProgress = (letter: string) => {
    const letterMarks = marks.filter(m => m.letter === letter);
    if (!letterMarks.length) return 0;

    const totalScore = letterMarks.reduce((acc, m) => acc + (m.score || 0), 0);
    const maxTotal = letterMarks.reduce((acc, m) => acc + (m.maxScore || 0), 0);
    if (!maxTotal) return 0;

    const percent = Math.round((totalScore / maxTotal) * 100);
    return percent > 100 ? 100 : percent;
  };

  // Total progress based on completed lessons
  const completedLessons = lessons.filter(letter => getLessonProgress(letter) > 0).length;
  const totalPercent = Math.round((completedLessons / lessons.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.letterContainer}>
        <Text style={styles.secondset}>PROGRESS</Text>
        <Image source={cover} style={{ width: 200, height: 200, resizeMode: 'contain' }} />
        <View style={styles.contentCard}>
          {/* Total progress bar based on lessons completed */}
          <ProgressBar progress={totalPercent > 100 ? 1 : totalPercent } />

          {/* <Text style={[styles.resultText, { fontSize: 20, marginVertical: 8 }]}>
            Total Progress: {totalPercent}%
          </Text> */}

          <ScrollView style={{ maxHeight: 240, width: '100%' }}>
            {lessons.map((letter, idx) => {
              const percent = getLessonProgress(letter);
              return (
                <View
                  key={letter}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: 248,
                    marginBottom: idx === lessons.length - 1 ? 16 : 4,
                    alignSelf: 'center',
                  }}
                >
                  <Text style={styles.resultText}>Lesson {letter}</Text>
                  <Text style={styles.resultText}>{percent}%</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.finish}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.btnText}>Back to Lessons</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

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
    alignItems:'center',
    paddingTop:16
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
});
