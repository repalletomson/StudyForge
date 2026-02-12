const Term = require('../models/Term');
const Program = require('../models/Program');
const Lesson = require('../models/Lesson');
const LessonAsset = require('../models/LessonAsset');

const getTerms = async (req, res) => {
  try {
    const { programId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const terms = await Term.find({ programId }).sort({ termNumber: 1 });
    res.json({ terms });
  } catch (error) {
    console.error('Get terms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createTerm = async (req, res) => {
  try {
    const { programId } = req.params;
    const { termNumber, title } = req.body;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const term = new Term({
      programId,
      termNumber,
      title
    });

    await term.save();
    res.status(201).json(term);
  } catch (error) {
    console.error('Create term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }
    res.json(term);
  } catch (error) {
    console.error('Get term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTerm = async (req, res) => {
  try {
    const { title } = req.body;

    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    if (title !== undefined) term.title = title;
    await term.save();

    res.json(term);
  } catch (error) {
    console.error('Update term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    const program = await Program.findById(term.programId);
    const lessons = await Lesson.find({ termId: term._id });

    for (const lesson of lessons) {
      await LessonAsset.deleteMany({ lessonId: lesson._id });
    }

    await Lesson.deleteMany({ termId: term._id });
    await Term.findByIdAndDelete(req.params.id);

    if (program && program.status === 'published') {
      await program.autoDraft();
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const closeTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    await term.close();
    res.json(term);
  } catch (error) {
    console.error('Close term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const openTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    await term.open();
    res.json(term);
  } catch (error) {
    console.error('Open term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTerms,
  createTerm,
  getTerm,
  updateTerm,
  deleteTerm,
  closeTerm,
  openTerm
};