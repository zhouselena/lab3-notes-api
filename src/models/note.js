import mongoose, { Schema } from 'mongoose';

// create a noteschema with a title field

const NoteSchema = new Schema(
  {
    title: String,
    text: String,
    x: Number,
    y: Number,
    size: Number,
    zIndex: Number,
    color: String,
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

// create NoteModel class from schema

const NoteModel = mongoose.model('Note', NoteSchema);

export default NoteModel;
