import Note from '../models/note';

export const getNotes = () => {
  return Note.find({}).then((notes) => {
    return notes.reduce((result, item) => {
      result[item.id] = item;
      return result;
    }, {});
  });
};

export const deleteNote = (id) => {
  return Note.findByIdAndDelete(id);
};

export const createNote = (fields) => {
  const newNote = new Note();
  newNote.title = fields.title;
  newNote.text = fields.text;
  newNote.x = fields.x;
  newNote.y = fields.y;
  newNote.size = fields.size;
  newNote.zIndex = fields.zIndex;
  newNote.color = fields.color;
  try {
    const savednote = newNote.save();
    return savednote;
  } catch (error) {
    throw new Error(`create note error: ${error}`);
  }
};

export const updateNote = (id, fields) => {
  return Note.findById(id).then((note) => {
    // check out this classy way of updating only the fields necessary
    Object.keys(fields).forEach((k) => {
      note[k] = fields[k];
    });
    return note.save();
  });
};
