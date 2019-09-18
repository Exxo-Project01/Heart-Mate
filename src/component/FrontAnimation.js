import * as Animatable from 'react-native-animatable';
import React, { Component } from 'react';
import {View} from 'react-native'
class Begin extends Component {
    constructor(props) {
        super(props);
        this.state = {  }
    }
    render() { 
        return ( 
            <View>
            <Animatable.Text animation="slideInDown" iterationCount={1} direction="alternate" style={{ textAlign: 'center',fontSize:30 }}>Heart Mate</Animatable.Text>
<Animatable.Text animation="pulse" easing="ease-out" iterationCount="infinite" style={{ textAlign: 'center',fontSize:50 }}>❤️</Animatable.Text>
</View>
         );
    }
}
 
export default Begin;
