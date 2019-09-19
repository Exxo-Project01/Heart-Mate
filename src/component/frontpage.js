import React, { Component } from 'react';
import {View,Image} from 'react-native'

class Frontpage extends Component {
    constructor(props) {
        super(props);
        this.state = {  }
    }
    render() { 
        return (
            <Image 
            source={require('../resources/heartbeat.gif')}  
            style={{width: '100%', height: '100%' }}
            
        />
        
          );
    }
}
 
export default Frontpage;