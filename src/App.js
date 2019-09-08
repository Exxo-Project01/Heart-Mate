/**
 * Sample React Native Audio Toolkit App
 * https://github.com/react-native-community/react-native-audio-toolkit
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { Modal, Alert, Button, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Player, Recorder, MediaStates } from '@react-native-community/audio-toolkit';
import { LineChart, Grid } from 'react-native-svg-charts'
var RNFS = require('react-native-fs');
import { db } from './config/firebase';
var RNFetchBlob = require('react-native-fetch-blob').default
const filename = 'test.mp4';

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
      playPauseButton: 'Preparing...',
      recordButton: 'Preparing...',

      stopButtonDisabled: true,
      playButtonDisabled: true,
      recordButtonDisabled: true,

      loopButtonStatus: false,
      progress: 0,
      data: [10,12],
      error: null
    };
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
      recordButton: this.recorder && this.recorder.isRecording ? 'Stop' : 'Record',

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
        }

        this._updateState();
      });
    });
  }

  _send() {

    let readfileRequest;
    
    if (Platform.OS == 'android') {
      readfileRequest = this._requestReadpermission();
    } else {
      recordAudioRequest = new Promise(function (resolve, reject) { resolve(true); });
    }

    
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
          RNFetchBlob.fs.readFile(this.recorder.fsPath, 'base64')
            .then((data) => {
              db.ref('/users').push({
                audio: data,
                name: "saman",
                prediction: "positive"
              }).then(data => {
                Alert.alert('success')
              })
            }).catch(err => {
              console.log(err)
            })
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
      <SafeAreaView>
        <View>
          <Text style={styles.title}>
            Playback
          </Text>
        </View>
        <View>
          <Button title={this.state.playPauseButton} disabled={this.state.playButtonDisabled} onPress={() => this._playPause()} />
          <Button title={'Stop'} disabled={this.state.stopButtonDisabled} onPress={() => this._stop()} />
        </View>
        <View style={styles.settingsContainer}>
          <Switch
            onValueChange={(value) => this._toggleLooping(value)}
            value={this.state.loopButtonStatus} />
          <Text>Toggle Looping</Text>
        </View>
        <View style={styles.slider}>
          <Slider step={0.0001} disabled={this.state.playButtonDisabled} onValueChange={(percentage) => this._seek(percentage)} value={this.state.progress} />
        </View>
        <View>
          <Text style={styles.title}>
            Recording
          </Text>
        </View>
        <View>
          <Button title={this.state.recordButton} disabled={this.state.recordButtonDisabled} onPress={() => this._toggleRecord()} />
        </View>
        <View>
          <Text style={styles.title}>
            Send
          </Text>
          <Button title={'send to database'} onPress={() => this._send()} />
        </View>
        <View>
          <Text style={styles.errorMessage}>{this.state.error}</Text>
        </View>
        <View>
          <Text style={styles.title}>
              Graph
          </Text>
          <View><Button title={'Start plot'} onPress={() => this._soundWavePlotter()} /></View>
          <LineChart
            style={{ height: 200 }}
            data={data}
            svg={{ stroke: 'rgb(134, 65, 244)' }}
            contentInset={{ top: 20, bottom: 20 }}
          >
          <Grid />
          </LineChart>
      </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  slider: {
    height: 10,
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
    padding: 20,
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    padding: 10,
    color: 'red'
  }
});
