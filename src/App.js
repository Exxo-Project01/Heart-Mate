/**
 * Sample React Native Audio Toolkit App
 * https://github.com/react-native-community/react-native-audio-toolkit
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import { Modal, Alert, Button, PermissionsAndroid, Platform, StyleSheet, Switch, Text, View, ScrollView,Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { Player, Recorder, MediaStates } from '@react-native-community/audio-toolkit';
import { LineChart, Grid } from 'react-native-svg-charts'
import Begin from './component/FrontAnimation'
import Frontpage from './component/frontpage'
var RNFS = require('react-native-fs');
import { db, storage } from './config/firebase';
var RNFetchBlob = require('react-native-fetch-blob').default
const filename = 'test.wav';
var userid;

type Props = {};

type State = {
  playPauseButton: string,
  recordButton: string,

  stopButtonDisabled: boolean,
  playButtonDisabled: boolean,
  recordButtonDisabled: boolean,

  loopButtonStatus: boolean,
  progress: number,
  data: [],
  error: string | null,
  plot: false,
};

export default class App extends Component<Props, State> {
  player: Player | null;
  recorder: Recorder | null;
  lastSeek: number;
  _progressInterval: IntervalID;

  constructor(props: Props) {
    super(props);

    this.state = {
      result:'Pending',
      playPauseButton: 'Preparing...',
      recordButton: 'Preparing...',

      stopButtonDisabled: true,
      playButtonDisabled: true,
      recordButtonDisabled: true,
      modalVisible:false,
      loopButtonStatus: false,
      progress: 0,
      data: [10,12],
      error: null,
      show:false
    };
  }
  componentDidMount(){
    setTimeout( () => {this.load()}, 5000);   
  }
  load(){
    this.setState({show:true})
  }

  componentWillMount() {
    this.player = null;
    this.recorder = null;
    this.lastSeek = 0;

    this._reloadPlayer();
    this._reloadRecorder();

    this._progressInterval = setInterval(() => {
      if (this.player && this._shouldUpdateProgressBar()) {
        let currentProgress = Math.max(0, this.player.currentTime) / this.player.duration;
        if (isNaN(currentProgress)) {
          currentProgress = 0;
        }
        this.setState({ progress: currentProgress });
      }
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this._progressInterval);
  }

  _shouldUpdateProgressBar() {
    // Debounce progress bar update by 200 ms
    return Date.now() - this.lastSeek > 200;
  }

  _updateState(err) {
    this.setState({
      playPauseButton: this.player && this.player.isPlaying ? 'Pause' : 'Play',
      recordButton: this.recorder && this.recorder.isRecording ? 'Stop' : 'Start Record',

      stopButtonDisabled: !this.player || !this.player.canStop,
      playButtonDisabled: !this.player || !this.player.canPlay || this.recorder.isRecording,
      recordButtonDisabled: !this.recorder || (this.player && !this.player.isStopped),
    });
  }

  _playPause() {
    this.player.playPause((err, paused) => {
      if (err) {
        this.setState({
          error: err.message
        });
        console.log(err)
      }
      this._updateState();
    });
  }

  _stop() {
    this.player.stop(() => {
      this._updateState();
    });
  }

  _seek(percentage) {
    if (!this.player) {
      return;
    }

    this.lastSeek = Date.now();

    let position = percentage * this.player.duration;

    this.player.seek(position, () => {
      this._updateState();
    });
  }

  _reloadPlayer() {
    if (this.player) {
      this.player.destroy();
    }

    this.player = new Player(filename, {
      autoDestroy: false
    }).prepare((err) => {
      if (err) {
        console.log('error at _reloadPlayer():');
        console.log(err);
      } else {
        this.player.looping = this.state.loopButtonStatus;
      }

      this._updateState();
    });

    this._updateState();

    this.player.on('ended', () => {
      this._updateState();
    });
    this.player.on('pause', () => {
      this._updateState();
    });
  }

  _reloadRecorder() {
    if (this.recorder) {
      this.recorder.destroy();
    }

    this.recorder = new Recorder(filename, {
      bitrate: 256000,
      channels: 2,
      sampleRate: 44100,
      quality: 'max'
    });

    this._updateState();
  }

  _toggleRecord() {
    if (this.player) {
      this.player.destroy();
    }

    let recordAudioRequest;
    if (Platform.OS == 'android') {
      recordAudioRequest = this._requestRecordAudioPermission();
    } else {
      recordAudioRequest = new Promise(function (resolve, reject) { resolve(true); });
    }

    recordAudioRequest.then((hasPermission) => {
      if (!hasPermission) {
        this.setState({
          error: 'Record Audio Permission was denied'
        });
        return;
      }

      this.recorder.toggleRecord((err, stopped) => {
        if (err) {
          this.setState({
            error: err.message
          });
        }
        if (stopped) {
          this._reloadPlayer();
          this._reloadRecorder();
          this._send();
        }

        this._updateState();
      });
    });
  }

 guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}


getresult() {
  return fetch('https://heart-sound-discrimination.herokuapp.com/predict?user_id='+userid)
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({modalVisible:true,result:responseJson.result})
      return responseJson;
    })
    .catch((error) => {
      console.error(error);
    });
}

  _send() {

    let readfileRequest;
    if (Platform.OS == 'android') {
      readfileRequest = this._requestReadpermission();
    } else {
      recordAudioRequest = new Promise(function (resolve, reject) { resolve(true); });
    }

    //userid=this.guidGenerator()
    userid="Joe1234"
    readfileRequest.then((hasPermission) => {
      if (!hasPermission) {
        this.setState({
          error: 'Record Audio Permission was denied'
        });
        return;
      }

      this.recorder.prepare((err) => {
        console.log(this.recorder.fsPath)
        if (!err) {
          //this.recorder.fspath shoud be the path to audio file
          // RNFetchBlob.fs.readFile(this.recorder.fsPath, 'base64')
          //   .then((data) => {
          //     console.log(data)
          //     db.ref('/users').child(userid).set({
          //       audio: data,
          //       name: userid,
          //       prediction: "positive"
          //     }).then(data => {
          //       Alert.alert('Audio sent for processing')
                
          //     })
          //   }).catch(err => {
          //     console.log(err)
          //   })
          const files = this.recorder.fsPath;
          console.log(files)
          const task = storage.ref().put(files);
          task.then((snapshot) => {
            console.log(snapshot.downloadURL);
          });
        
        //   files.map( filename => {
        //     storage
        //       .ref()
        //       .child('users/'+userid)
        //       .getDownloadURL()
        //       .then( url => {
        //         console.log( "Got download url: ", url );
        //       });
        // });
        }
      })
    }
    )
  }

  async _soundWavePlotter(){
    //doPlot = this.state.plot
    let data = this.state.data
    data.push(Math.floor(Math.random()*20))

    if(data.length>50){
      data.shift() 
    } 
  }

  async _requestRecordAudioPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        (PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
        {
          title: 'Microphone Permission',
          message: 'ExampleApp needs access to your microphone to test react-native-audio-toolkit.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }




  async _requestReadpermission() {
    try {
      const granted = await PermissionsAndroid.request(
        (PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE && PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE),
        {
          title: 'Read Permission',
          message: 'ExampleApp needs access to your file to read audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  _toggleLooping(value) {
    this.setState({
      loopButtonStatus: value
    });
    if (this.player) {
      this.player.looping = value;
    }
  }

  render() {
    let data = this.state.data
    
    return (
      <View style={styles.page}>
        {this.state.show
        ?
        <View style={styles.page}>
        <ScrollView style={styles.scroll}>
          <Begin></Begin>
           <Modal
            animationType="slide"
            transparent={false}
            visible={this.state.modalVisible}
            
            onRequestClose={() => {
              Alert.alert('Modal has been closed.');
              this.setState({modalVisible:false})
  
            }}> 
            <Text style={styles.title}>
              {this.state.result}
            </Text></Modal>
          {!this.state.playButtonDisabled ?
          <View >
  
             <View style={styles.slider}>
            <Slider step={0.0001} disabled={this.state.playButtonDisabled} onValueChange={(percentage) => this._seek(percentage)} value={this.state.progress} />
            <View style={styles.settingsContainer}>
  
            <Switch
              onValueChange={(value) => this._toggleLooping(value)}
              value={this.state.loopButtonStatus} />
                      </View>
  
          </View>
          <View style={{ flexDirection:'row' }}>
            <Button title={this.state.playPauseButton} disabled={this.state.playButtonDisabled} onPress={() => this._playPause()} />
            <Button title={'Stop'} disabled={this.state.stopButtonDisabled} onPress={() => this._stop()} />
            </View>
            <View ><Button style={styles.button} title={'Show My Result'} onPress={() => this.getresult()} /></View>
          </View>:
          <View>
           
          </View>
          }
          
          
          {/* <View>
            <Text style={styles.title}>
              Send
            </Text>
            <Button title={'send to database'} onPress={() => this._send()} />
          </View> */}
          
          <View>
            <Text style={styles.errorMessage}>{this.state.error}</Text>
          </View>
        
          <View style={{padding:4 }}>
            <Button title={this.state.recordButton} disabled={this.state.recordButtonDisabled} onPress={() => this._toggleRecord()} />
          </View>
        
            <View  style={{padding:4 }}><Button style={styles.button} title={'Start plot'} onPress={() => this._soundWavePlotter()} /></View>
            <View style={{width:wp('80%') }}>
              <LineChart
                style={{height:hp('40%'),width:wp('100%') }}
                data={data}
                svg={{ stroke: 'rgb(134, 65, 244)' }}
                contentInset={{ top: 20, bottom: 20 }}
              >
            <Grid />
            </LineChart>
  
              </View>
       
        </ScrollView>
        </View>
        :
        <View style={styles.page}>
        <Frontpage></Frontpage>
       </View>
        }
      </View>

   
    );
  }
}

const styles = StyleSheet.create({
  page:{
    flex:1,
    justifyContent: 'center'
  },
  scroll:{
    padding: 20,
  },
  slider: {
    height: hp('0.5%'),
    margin: 10,
    marginBottom: 50,
  },
  settingsContainer: {
    alignItems: 'center',
  },
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    padding: 10,
    color: 'red'
  }
});
