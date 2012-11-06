webrtc-expo-server-demo
=======================

This is code for the Plantronics keynote demo at the WebRTC Expo 2012.

The code is largley based on a port of Anant Narayanan's gupshup demo found here: https://github.com/anantn/gupshup.

Edits of note:
app.js - a change in port and removal of the https requirement
chat.ejs - changed import of JavaScript file to "plantronicschat.js"

plantronicschat.js - has added websocket connection support to for the plantronics client side service.
JSON is used as the format for the messages that are passed back and forth between the browser and client service


Run "npm install" no pull down all of the required node.js libs.

Set the AUDIENCE environment variable on startup to it's own URL, so start it like this:

AUDIENCE="http://64.101.40.11:8000/" node app.js

We are currently using the firefox trunk code from Nov. 6th, so update your mozilla-central to that revision like this:

hg update -r ed13d73c61bb

And build Nightly from that source.

