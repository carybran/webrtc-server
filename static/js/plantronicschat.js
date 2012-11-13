
if (!console || !console.log) {
  var console = {
    log: function() {}
  };
}

// Ugh, globals.
var peerc;
var source = new EventSource("events");


//CAB additions
$(document).ready(function(){connectToHeadset();});


$("#incomingCall").modal();
$("#incomingCall").modal("hide");

$("#incomingCall").on("hidden", function() {
  document.getElementById("incomingRing").pause();
});

source.addEventListener("ping", function(e) {}, false);

source.addEventListener("userjoined", function(e) {
  appendUser(e.data);
}, false);

source.addEventListener("userleft", function(e) {
  removeUser(e.data);
}, false);

source.addEventListener("offer", function(e) {
  var offer = JSON.parse(e.data);
  //TODO - CAB is this the right spot?
  ringHeadset(true, offer);
  document.getElementById("incomingUser").innerHTML = offer.from;
  document.getElementById("incomingAccept").onclick = function() {
    $("#incomingCall").modal("hide");
    //call is being answered via a button click tell the headset to stop ringing
    ringHeadset(false, offer);
    
    acceptCall(offer);
  };
  $("#incomingCall").modal();
  document.getElementById("incomingRing").play();
  
}, false);

source.addEventListener("answer", function(e) {
  var answer = JSON.parse(e.data);
  peerc.setRemoteDescription(JSON.parse(answer.answer), function() {
    console.log("Call established!");
  }, error);
}, false);

function log(info) {
  var d = document.getElementById("debug");
  d.innerHTML += info + "\n\n";
}

function appendUser(user) {
  var d = document.createElement("div");
  d.setAttribute("id", btoa(user));

  var a = document.createElement("a");
  a.setAttribute("class", "btn btn-block btn-inverse");
  a.setAttribute("onclick", "initiateCall('" + user + "');");
  a.innerHTML = "<i class='icon-user icon-white'></i> " + user;

  d.appendChild(a);
  d.appendChild(document.createElement("br"));
  document.getElementById("users").appendChild(d);
}

function removeUser(user) {
  var d = document.getElementById(btoa(user));
  if (d) {
    document.getElementById("users").removeChild(d);
  }
}

// TODO: refactor, this function is almost identical to initiateCall().
function acceptCall(offer) {
  log("Incoming call with offer " + offer.from);
  document.getElementById("main").style.display = "none";
  document.getElementById("call").style.display = "block";

  navigator.mozGetUserMedia({video:true}, function(vs) {
    document.getElementById("localvideo").mozSrcObject = vs;
    document.getElementById("localvideo").play();

    navigator.mozGetUserMedia({audio:true}, function(as) {
    		    
      document.getElementById("localaudio").mozSrcObject = as;
      document.getElementById("localaudio").play();

      var pc = new mozRTCPeerConnection();
      pc.addStream(vs);
      pc.addStream(as);

      pc.onaddstream = function(obj) {
        log("Got onaddstream of type " + obj.type);
        if (obj.type == "video") {
          document.getElementById("remotevideo").mozSrcObject = obj.stream;
          document.getElementById("remotevideo").play();
        } else {
        
          //TODO - query for the headset and then set the number of channels and bitrate
          document.getElementById("remoteaudio").mozSetup(1,16000);
        	
          document.getElementById("remoteaudio").mozSrcObject = obj.stream;
          document.getElementById("remoteaudio").play();
        }
        document.getElementById("dialing").style.display = "none";
        document.getElementById("hangup").style.display = "block";
      };

      pc.setRemoteDescription(JSON.parse(offer.offer), function() {
        log("setRemoteDescription, creating answer");
        pc.createAnswer(function(answer) {
          pc.setLocalDescription(answer, function() {
            // Send answer to remote end.
            log("created Answer and setLocalDescription " + JSON.stringify(answer));
            peerc = pc;
            jQuery.post(
              "answer", {
                to: offer.from,
                from: offer.to,
                answer: JSON.stringify(answer)
              },
              function() { console.log("Answer sent!"); }
            ).error(error);
          }, error);
        }, error);
      }, error);
    }, error);
  }, error);
}

function initiateCall(user) {
  document.getElementById("main").style.display = "none";
  document.getElementById("call").style.display = "block";

  navigator.mozGetUserMedia({video:true}, function(vs) {
    document.getElementById("localvideo").mozSrcObject = vs;
    document.getElementById("localvideo").play();

    navigator.mozGetUserMedia({audio:true}, function(as) {
      document.getElementById("localaudio").mozSrcObject = as;
      document.getElementById("localaudio").play();

      var pc = new mozRTCPeerConnection();
      pc.addStream(vs);
      pc.addStream(as);

      pc.onaddstream = function(obj) {
        log("Got onaddstream of type " + obj.type);
        if (obj.type == "video") {
          document.getElementById("remotevideo").mozSrcObject = obj.stream;
          document.getElementById("remotevideo").play();
        } else {
          document.getElementById("remoteaudio").mozSrcObject = obj.stream;
          document.getElementById("remoteaudio").play();
        }
        document.getElementById("dialing").style.display = "none";
        document.getElementById("hangup").style.display = "block";
      };

      pc.createOffer(function(offer) {
        log("Created offer" + JSON.stringify(offer));
        pc.setLocalDescription(offer, function() {
          // Send offer to remote end.
          log("setLocalDescription, sending to remote");
          peerc = pc;
          jQuery.post(
            "offer", {
              to: user,
              from: document.getElementById("user").innerHTML,
              offer: JSON.stringify(offer)
            },
            function() { console.log("Offer sent!"); }
          ).error(error);
        }, error);
      }, error);
    }, error);
  }, error);
}

function endCall() {
  log("Ending call");
  document.getElementById("call").style.display = "none";
  document.getElementById("main").style.display = "block";

  document.getElementById("localvideo").pause();
  document.getElementById("localaudio").pause();
  document.getElementById("remotevideo").pause();
  document.getElementById("remoteaudio").pause();

  document.getElementById("localvideo").src = null;
  document.getElementById("localaudio").src = null;
  document.getElementById("remotevideo").src = null;
  document.getElementById("remoteaudio").src = null;
  
  disconnectHeadset();

  peerc = null;
}

function error(e) {
  if (typeof e == typeof {}) {
    alert("Oh no! " + JSON.stringify(e));
  } else {
    alert("Oh no! " + e);
  }
  endCall();
}

//Plantronics functions
var SETTING_DEVICE_INFO = {
		    type:"setting",
		    id:"0X0F02"};

var EVENT_RING ={
	    type:"event",
	    id:"0X0E0F"};        
	    
var EVENT_ACCEPT_CALL ={
	    type:"event",
	    id:"0X0E0C"};

var EVENT_RING_TERMINATE ={
	     type:"event",
	     id:"0X0E0D"};

var EVENT_RINGING ={
	    type:"event",
	    id:"0X0E10"};

var EVENT_CALL_TERMINATE ={
	    type:"event",
	    id:"0X0E11"};

var EVENT_MUTE ={
	    type:"event",
	    id:"0X0E02"};

var EVENT_BUTTON_PRESS = {
	    type:"event",
	    id:"0X0600"};
	    
var EVENT_WEAR_STATE_CHANGED = {
	    type:"event",
	    id:"0X0200"};
	   	    
var EVENT_PROXIMITY = {
	    type:"event",
	    id:"0X0200"}; 

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
	    id:"0X000C"};
	    
var COMMAND_MUTE_HEADSET = {
	    type:"command",
	    id:"0X0D0A"};
	    
var COMMAND_UNMUTE_HEADSET = {
	    type:"command",
	    id:"0X0D0B"};
	    
var plantronicsSocket = null;

function muteHeadset (isMuted) {
     if(!plantronicsSocket){
		return;
     }
    if(isMuted){
	console.log("muting headset");
	plantronicsSocket.send(JSON.stringify(COMMAND_MUTE_HEADSET));
    }
    else{
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
    }
    else{
	console.log("stopped ringing headset");
	COMMAND_STOP_RINGING_HEADSET.payload.offer = offer.from;
	plantronicsSocket.send(JSON.stringify(COMMAND_STOP_RINGING_HEADSET));    
    }
}

var isConnectedToHeadset = false;

function connectToHeadset(){
//todo make this dyamic to adjust to SSL
	var uri = 'ws://localhost:8888/plantronics';
	plantronicsSocket = new WebSocket(uri);
	plantronicsSocket.onopen = function (evt) {
	    console.log("connected to Plantronics headset service");
	    isConnectedToHeadset = true;
	    //ringHeadset(true, offer);
	};
	plantronicsSocket.onclose = function (evt) {
	    onClose(evt);
	    isConnectedToHeadset = false;
	};
	plantronicsSocket.onmessage = function (evt) {
	    var pltMessage = JSON.parse(evt.data);
	    processPLTMessage(pltMessage);
	};
	plantronicsSocket.onerror = function (evt) {
	    onError(evt);
	    isConnectedToHeadset = false;
	};	
}

/*
function connectToHeadset(offer) {
	
	//todo make this dyamic to adjust to SSL
	var uri = 'ws://localhost:8888/plantronics';
	plantronicsSocket = new WebSocket(uri);
	plantronicsSocket.onopen = function (evt) {
	    console.log("connected to Plantronics headset service");
	    ringHeadset(true, offer);
	};
	plantronicsSocket.onclose = function (evt) {
	    onClose(evt)
	};
	plantronicsSocket.onmessage = function (evt) {
	    var pltMessage = JSON.parse(evt.data);
	    processPLTMessage(pltMessage, offer);
	};
	plantronicsSocket.onerror = function (evt) {
	    onError(evt)
	};
 }
 */
 function disconnectHeadset(){
 	 if(plantronicsSocket){
 	 	 plantronicsSocket.close();
 	 }
 }

function onClose(evt) {
	console.log("Plantronics headset service connection closed");
}

function onError(evt) {
	console.log("error connecting to headset service");
	plantronicsSocket = null;
}

function processPLTMessage(msg) {
	//Process message from context server. If relevant to RTC server, call applicable methods.
	var messageType = msg.type;
	if ("setting" == messageType) {
	    console.log("Plantronics device settings received");
	}
	else if ("event" == messageType) {
	    if (msg.id == EVENT_ACCEPT_CALL.id) {
		console.log("Plantronics headset has accepted the call");
		$("#incomingCall").modal("hide");
		acceptCall(msg.payload.offer);
		
	    }
	    if (msg.id == EVENT_CALL_TERMINATE.id) {
		console.log("Plantronics headset has terminated the call");
		endCall();
	    }
	    else if (msg.id == EVENT_RING.id) {
		console.log("Plantronics headset is ringing");
	    }
	    else if (msg.id == EVENT_RING_TERMINATE.id) {
		console.log("Plantronics headset is answering the call");
		//TODO - fill me in with the right action
	    }
	    else if (msg.id == EVENT_MUTE.id) {
		console.log("Plantronics headset is muted");
	    }
	    else if(msg.id == EVENT_BUTTON_PRESS.id){
		console.log("Plantronics headset button pressed" +  msg.payload.buttonName);
	    }
	    else if(msg.id == EVENT_WEAR_STATE_CHANGED.id){
		if(msg.payload.worn == "true"){
		   console.log("Plantronics headset worn");
		}
		else{
		   console.log("Plantronics headset not worn");
		}
	    }
	    else if(msg.id ==  EVENT_PROXIMITY.id){
	    	if(msg.payload.proximity == "near"){
		   console.log("Plantronics headset is near");
		}
		else{
		   console.log("Plantronics headset is far");
		}    
	    }
	    else{
	    	    console.log("Unknown event recieved: " + msg.id);
	    }
	    
	}
}


