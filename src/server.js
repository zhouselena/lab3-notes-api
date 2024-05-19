import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import socketio from 'socket.io';
import http from 'http';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';
import * as Notes from './controllers/note_controller';

// initialize
const app = express();

// enable/disable cross origin resource sharing if necessary
app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse the incoming requests with JSON payloads

// additional init stuff should go before hitting the routing
// DB Setup
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/notes';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
// set mongoose promises to es6 default
mongoose.Promise = global.Promise;

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
async function startServer() {
  try {
    const port = process.env.PORT || 9090;
    const server = http.createServer(app);
    const io = socketio(server, {
      cors: {
        origin: '*', // allows requests all incoming connections
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });
    // at the bottom of server.js
    // lets register a connection listener
    io.on('connection', (socket) => {
      // add these at the top of your: io.on('connection' section
      let emitToSelf = (notes) => {
        socket.emit('notes', notes);
      };
      emitToSelf = debounce(emitToSelf, 200);

      let emitToOthers = (notes) => {
        socket.broadcast.emit('notes', notes);
      };
      emitToOthers = throttle(emitToOthers, 25);

      const pushNotesSmoothed = () => {
        Notes.getNotes().then((result) => {
          emitToSelf(result);
          emitToOthers(result);
        });
      };

      // on first connection emit notes
      Notes.getNotes().then((result) => {
        socket.emit('notes', result);
      });

      // pushes notes to everybody
      const pushNotes = () => {
        Notes.getNotes().then((result) => {
          // broadcasts to all sockets including ourselves
          io.sockets.emit('notes', result);
        });
      };

      // creates notes and
      socket.on('createNote', (fields) => {
        Notes.createNote(fields)
          .then((result) => {
            pushNotes();
          })
          .catch((error) => {
            console.log(error);
            socket.emit('error', 'create failed');
          });
      });

      // on update note do what is needful
      socket.on('updateNote', (id, fields) => {
        Notes.updateNote(id, fields).then(() => {
          if (fields.text) {
            pushNotes();
          } else {
            pushNotesSmoothed();
          }
        });
      });

      // on deleteNote do what is needful
      socket.on('deleteNote', (id) => {
        Notes.deleteNote(id).then(() => {
          pushNotes();
        });
      });
    });
    server.listen(port);

    console.log(`Listening on port ${port}`);
  } catch (error) {
    console.error(error);
  }
}

startServer();
