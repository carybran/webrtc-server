//Plantronics functions

//Settings requests that get sent to the device
var SETTING_DEVICE_INFO = {
		    type:"setting",
		    id:"0X0F02"};

var SETTING_USERNAME = {
		    type:"setting",
		    id:"0X0F03"};


//Events that get generated from the device
var EVENT_ACCEPT_CALL ={
	    type:"event",
	    id:"0X0E0C"};

var EVENT_CALL_TERMINATE ={
	    type:"event",
	    id:"0X0E11"};

var EVENT_BUTTON_PRESS = {
	    type:"event",
	    id:"0X0600"};

var EVENT_WEAR_STATE_CHANGED = {
	    type:"event",
	    id:"0X0200"};

var EVENT_PROXIMITY = {
	    type:"event",
	    id:"0X0100"};

//Commands that get sent to the device
var COMMAND_RING_HEADSET = {
	    type:"command",
	    id:"0X0D08",
            payload:{callId:1, offer:""}};

var COMMAND_STOP_RINGING_HEADSET = {
	    type:"command",
	    id:"0X0D09",
            payload:{offer:"", callId:1}};

var COMMAND_HANGUP_HEADSET = {
	    type:"command",
	    id:"0X000C",
            payload:{callId:1}};

var COMMAND_MUTE_HEADSET = {
	    type:"command",
	    id:"0X0D0A"};

var COMMAND_UNMUTE_HEADSET = {
	    type:"command",
	    id:"0X0D0B"};

//one more global .. sorry BOM
plantronicsSocket = null;

function muteHeadset (isMuted) {
  if(!plantronicsSocket){
	  return;
  }

  if(isMuted) {
	  console.log("muting headset");
	  plantronicsSocket.send(JSON.stringify(COMMAND_MUTE_HEADSET));
  } else{
    console.log("unmuting headset");
    plantronicsSocket.send(JSON.stringify(COMMAND_UNMUTE_HEADSET));
    }
}

function ringHeadset (startRinging, offer) {
  if(!plantronicsSocket || !offer){
   return;
  }
  if(startRinging){
	  console.log("ringing headset");
	  COMMAND_RING_HEADSET.payload.offer = offer;
	  plantronicsSocket.send(JSON.stringify(COMMAND_RING_HEADSET));
  } else{
	  console.log("stopped ringing headset");
	  COMMAND_STOP_RINGING_HEADSET.payload.offer = offer.from;
	  plantronicsSocket.send(JSON.stringify(COMMAND_STOP_RINGING_HEADSET));
  }
}

function connectToHeadset(){
//todo make this dyamic to adjust to SSL
	var uri = 'ws://localhost:8888/plantronics';
	plantronicsSocket = new WebSocket(uri);
	plantronicsSocket.onopen = function (evt) {
	    console.log("connected to Plantronics headset service");
	};
	plantronicsSocket.onclose = function (evt) {
	    console.log("Plantronics headset service connection closed");
	};
	plantronicsSocket.onmessage = function (evt) {
	    var pltMessage = JSON.parse(evt.data);
	    processPLTMessage(pltMessage);
	};
	plantronicsSocket.onerror = function (evt) {
	    console.log("error connecting to headset service");
	    plantronicsSocket = null;
	};
}

function queryHeadsetOwner() {
  if(plantronicsSocket == null){
    return;
  }
  plantronicsSocket.send(JSON.stringify(SETTING_USERNAME));
}

function processPLTMessage(msg) {
	//Process message from context server. If relevant to RTC server, call applicable methods.
	var messageType = msg.type;
	if ("setting" == messageType) {
	    console.log("Plantronics device settings received");
	    if(msg.id == SETTING_USERNAME.id) {
        document.getElementById('username').value = msg.payload.username;
	    }
	} else if ("event" == messageType) {
	    if (msg.id == EVENT_ACCEPT_CALL.id) {
		      console.log("Plantronics headset has accepted the call");
		      $("#incomingCall").modal("hide");
		      //Assumes offer is being resent from the Headset service
		      acceptCall(msg.payload.offer);
	    } else if (msg.id == EVENT_CALL_TERMINATE.id) {
		      console.log("Plantronics headset is no longer on the call");
		      var params = {
            fromHeadset: true,
            remoteTerm : true
          };
		      endCall(params);
	    } else if(msg.id == EVENT_BUTTON_PRESS.id) {
		      console.log("Plantronics headset button pressed" +  msg.payload.buttonName);
	    } else if(msg.id == EVENT_WEAR_STATE_CHANGED.id){
		      if(msg.payload.worn == "true") {
		        console.log("Plantronics headset worn");
		      } else {
		        console.log("Plantronics headset not worn");
		      }
	    } else if(msg.id ==  EVENT_PROXIMITY.id) {
	    	  if(msg.payload.proximity == "near") {
		        console.log("Plantronics headset is near");
		      } else {
		        console.log("Plantronics headset is far");
		      }
	    }
	    else{
	    	    console.log("Unknown event recieved: " + msg.id);
	    }
	}
}
