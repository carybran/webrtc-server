
if (!console || !console.log) {
  var console = {
    log: function() {}
  };
}

// Ugh, globals.
var peerc;
var source = new EventSource("events");
var peerUser;


//CAB additions
$(document).ready(function(){connectToHeadset();});


$("#incomingCall").modal();
$("#incomingCall").modal("hide");
 
source.addEventListener("ping", function(e) {}, false);

source.addEventListener("wearstate", function(e) {
  var status = JSON.parse(e.data);
	
  //console.log("status user = " + status.user + " wearstate = " + status.wearstate);
  //check to see if the user is already in the list - if so no need to add
  if(!document.getElementById(status.user + "_status")){
   return;
  }

  document.getElementById(status.user + "_status").innerHTML = status.wearstate;	
}, false);

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
  document.getElementById("incomingPic").src = "img/" + offer.from.toLowerCase() + ".png";
  document.getElementById("incomingUser").innerHTML = offer.from;
  document.getElementById("incomingAccept").onclick = function() {
    $("#incomingCall").modal("hide");
    //call is being answered via a button click tell the headset to stop ringing
    ringHeadset(false, offer);
    acceptCall(offer);
  };
  $("#incomingCall").modal();
  //document.getElementById("incomingRing").play();

}, false);

source.addEventListener("answer", function(e) {
  var answer = JSON.parse(e.data);
  peerc.setRemoteDescription(JSON.parse(answer.answer), function() {
    console.log("Call established!");
  }, error);
}, false);

source.addEventListener("endSession", function(e) {
  var message = JSON.parse(e.data);
  //since the remote-end point ended the session
  // we treat it as not from headset - fair enough
  var params = {
    fromHeadset: false,
    remoteTerm : true
  };
  endCall(params);
}, false);

//TODO: Suhas to enable logs.
function log(info) {
  //var d = document.getElementById("debug");
  //d.innerHTML += info + "\n\n";
}


function appendUser(user) {
	//check to see if the user is already in the list - if so no need to add
	if(document.getElementById(btoa(user) + "_1")){
	   return;
	}
	//check to see if user is the already logged in user - if so no need to add
	if(document.getElementById("user").innerHTML == user){
	   return
	}
  //TODO: replace this clunky code with ejs template
	//select contact list table
  var $table = $('#contactlist');
  var userId = btoa(user);
  var tds = '<tr id= \"' + userId + '_1\">';
  tds += '<td rowspan=\"2\"><img src=\"img/' + user.toLowerCase() + '.png\"></td>';
  tds += '<td> '+user+'<span class=\"available\" id=\"'+ user +'_status\">'+" - Available"+ '</span></td>';
  tds += '</tr>';
  $table.append(tds);
  tds = '<tr id= \"' + userId + '_2\">';
  tds += '<td><button class=\"btn btn-small btn-primary\" type=\"button\" style=\"width:43%;\"';
  tds += 'onclick=\"initiateCall(';
  tds += '\'' + user + '\'';
  tds += ')\";> Call </button></td>';
  tds += '</tr>';
  $table.append(tds);
}

function removeUser(user) {
  //remove the first part of the user - info
  var user_data = btoa(user)+"_1";
  var d = document.getElementById(user_data);
  if (d) {
    $(d).remove();
  }
  //get the 2 part of the user - info
  user_data = btoa(user)+"_2";
  d = document.getElementById(user_data);
  if (d) {
    $(d).remove();
  }
}

// TODO: refactor, this function is almost identical to initiateCall().
function acceptCall(offer) {
  log("Incoming call with offer " + offer.from);
  peerUser = offer.from;
  document.getElementById("contentwindow").style.display = "none";
  document.getElementById("videowindow").style.display = "block";

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
        if (obj.type == "video") {
          document.getElementById("remotevideo").mozSrcObject = obj.stream;
          document.getElementById("remotevideo").play();
        } else {

          var device = getPlantronicsHeadset();
          console.log("device = " + device);
          if(device){
          	  document.getElementById("remoteaudio").mozSetup(device.numberOfChannels,device.sampleRate);
          
          }
          else{
          	  document.getElementById("remoteaudio").mozSetup(1,16000);
          }

          document.getElementById("remoteaudio").mozSrcObject = obj.stream;
          document.getElementById("remoteaudio").play();
        }
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
  peerUser = user;

  document.getElementById("contentwindow").style.display = "none";
  document.getElementById("videowindow").style.display = "block";

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

//CAB - added param to determine if the end call came from a button
// press or a headset event
function endCall(params) {
  var remoteTermRequest = false;
  var termFromHeadset = false;
  log("Ending call");
  if(params) {
    if(params.remoteTerm == true)
        remoteTermRequest = true;
    if(params.fromHeadset == true)
        termFromHeadset = true;
  }

  if( remoteTermRequest == false) {
    //notify the peer to avoid jitter buffer animation
   jQuery.post(
        "endSession", {
          to: peerUser,
          from: document.getElementById("user").innerHTML
          },
       function() { console.log("endSession sent!"); }
      ).error(error);
  }

  //the call was not ended by a headset event - e.g. the user pressed a button
  if(termFromHeadset == false) {
    if(plantronicsSocket ){
       console.log("hanging up headset headset");
      plantronicsSocket.send(JSON.stringify(COMMAND_HANGUP_HEADSET));
     }
  }

  //NOTE: even after we end the session. camera continues to run.
  // Is this a bug ... Suhas to check ..
  document.getElementById("videowindow").style.display = "none";
  document.getElementById("contentwindow").style.display = "block";

  document.getElementById("localvideo").pause();
  document.getElementById("localaudio").pause();
  document.getElementById("remotevideo").pause();
  document.getElementById("remoteaudio").pause();

  document.getElementById("localvideo").src = null;
  document.getElementById("localaudio").src = null;
  document.getElementById("remotevideo").src = null;
  document.getElementById("remoteaudio").src = null;

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



