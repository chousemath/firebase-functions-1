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
    res.setHeader('Content-Type', 'application/json');
    res.status(201);
    // HTTP functions must be terminated with res.redirect(), res.send(), or res.end()
    res.send(JSON.stringify({
      status: 'created',
      ok: true,
      message: 'a message entry has been created'
    }));
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
  // set() returns a promise, we keep the function alive by returning a promise
  return admin.database().ref('/most-recent').child('data').set(original).then(() => {
    event.data.ref.parent.child('lowercase').set(lowercase);
  }).then(() => {
    event.data.ref.parent.child('uppercase').set(uppercase);
  });  
});
