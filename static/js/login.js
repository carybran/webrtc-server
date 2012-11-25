
function prereqs() {
  if (!navigator.mozGetUserMedia) {
    redirect("Sorry, getUserMedia is not available! (Did you set media.navigator.enabled?)");
    return;
  }
  if (!window.mozRTCPeerConnection) {
    redirect("Sorry, PeerConnection is not available! (Did you set media.peerconnection.enabled?)");
    return;
  }

//CAB additions
// We depend on a global here.
//TODO: Implement headset code as object than globals
$(document).ready(function(){connectToHeadset(function(){showLogin();});});

  // All pre-requisites available! TODO: Provide loggedInEmail param.
  if (navigator.id) {
    navigator.id.watch({
      onlogin: doLogin,
      onlogout: function() {
        jQuery.post(
          "logout", null,
          function() { redirect("You have been logged out!"); }
        ).error(function() { redirect("Logout failed!"); });
      }
    });
  }

  // Enable the sign-in/sign-out button, if needed.
  showLogin();
}

function doLogin(ast) {
  jQuery.post(
    "login", {assertion: ast},
    function() { window.location.reload(); }
  ).error(function() { redirect("Login failed!"); });
}

function redirect(msg, force) {
  if (force || window.location.search == "") {
    window.location.href ="login?err=" + encodeURIComponent(msg);
  } else {
    showLogin();
  }
}

function showLoader() {
  var box = document.getElementById("login-box");
  var loader = document.getElementById("loading");
  if (box && loader) {
    box.style.display = "none";
    loader.style.display = "block";
  }
}

function showLogin() {
  var box = document.getElementById("login-box");
  if (box) {
    box.style.display = "block";
  }

  //check to see if we are connected to the headset
  queryHeadsetOwner();
}

prereqs();
