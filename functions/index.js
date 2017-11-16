/*
 * Firebase CLI automatically installs Firebase and Firebase SDK
*/

// require in the firebase sdk to setup triggers
const functions = require('firebase-functions');
// admin sdk allows you to access firebase realtime db
const admin = require('firebase-admin');
// initialize an admin app instance (to make changes to realtime db)
admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// ExpressJS style request/response objects
// http functions are synchronous, so return a response as quickly as possible
exports.addMessage = functions.https.onRequest((req, res) => {
  // extract the text parameter from the request BODY
  const original = req.body.text;

  // push message into rtdb with firebase admin sdk
  // inserts the message under /messages/:pushId/original
  // but where does the pushId come from?
  admin.database().ref('/messages').push({ original: original }).then(snapshot => {
    res.redirect(303, snapshot.ref);
  });
});

// listen for new messages to the /messages/{pushId}/original reference point
// for performance reasons, you should be as specific as possible when defining the reference point
// surround parameters with curly braces (e.g. {pushId} )
// fbrtdb triggers the .onWrite callback when data is written/updated on the defined reference point
// event-driven functions are asynchronous
exports.makeUpperAndLowercase = functions.database.ref('messages/{pushId}/original').onWrite(event => {
  // grab the data from the event
  const original = event.data.val();
  console.log('Uppercasing ', event.params.pushId, original);
  const uppercase = original.toUpperCase();
  const lowercase = original.toLowerCase();
  // must return a promise when performing asynch tasks inside a function
  // writing to fbrtdb is an asynch task
  // callback function should return null, Object, or Promise
  admin.database().ref('/most-recent').child('data').set(original);
  event.data.ref.parent.child('lowercase').set(lowercase);
  return event.data.ref.parent.child('uppercase').set(uppercase);
});
