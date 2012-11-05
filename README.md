webrtc-expo-server-demo
=======================

This is code for the Plantronics keynote demo at the WebRTC Expo 2012.

The code is largley based on a port of Anant Narayanan's gupshup demo found here: https://github.com/anantn/gupshup.

Edits of note:
app.js - a change in port and removal of the https requirement
chat.ejs - changed import of JavaScript file to "plantronicschat.js"

plantronicschat.js - has added websocket connection support to for the plantronics client side service.
JSON is used as the format for the messages that are passed back and forth between the browser and client service


