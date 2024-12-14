const { TvProgram } = require('../models/index');

exports.createTvProgram = async (req, res) => {
    try {
        const { program } = req.body;

        const newTvProgram = await TvProgram.create({ program });
        res.status(201).json(newTvProgram);
    } catch (error) {
        res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
    }
};

exports.getAllTvPrograms = async (req, res) => {
    try {
        const tvPrograms = await TvProgram.findAll();
        res.json(tvPrograms);
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
};

exports.getTvProgramById = async (req, res) => {
    try {
        const { id } = req.params;

        const tvProgram = await TvProgram.findByPk(id);
        if (!tvProgram) {
            return res.status(404).json({ error: 'Программа не найдена' });
        }

        res.json(tvProgram);
    } catch (error) {
        res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
    }
};

exports.updateTvProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { program } = req.body;

        const tvProgram = await TvProgram.findByPk(id);
        if (!tvProgram) {
            return res.status(404).json({ error: 'Программа не найдена' });
        }

        tvProgram.program = program || tvProgram.program;
        await tvProgram.save();
        res.json(tvProgram);
    } catch (error) {
        res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
    }
};

exports.deleteTvProgram = async (req, res) => {
    try {
        const { id } = req.params;

        const tvProgram = await TvProgram.findByPk(id);
        if (!tvProgram) {
            return res.status(404).json({ error: 'Программа не найдена' });
        }

        await tvProgram.destroy();
        res.json({ message: 'Программа успешно удалена' });
    } catch (error) {
        res.status(500).json({ error: `Ошибка сервера: ${error.message}` });
    }
};
