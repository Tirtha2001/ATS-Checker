const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { extractTextFromFile, getATSScoreAndSuggestions } = require('./utils');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/ats-score', upload.fields([{ name: 'jobDescription' }, { name: 'resume' }]), async (req, res) => {
    try {
        let jobDescriptionText = req.body.jobDescriptionText;
        let resumeText;

        if (req.files['jobDescription']) {
            jobDescriptionText = await extractTextFromFile(req.files['jobDescription'][0]);
            fs.unlinkSync(req.files['jobDescription'][0].path);
        }

        if (req.files['resume']) {
            resumeText = await extractTextFromFile(req.files['resume'][0]);
            fs.unlinkSync(req.files['resume'][0].path);
        }

        if (!jobDescriptionText || !resumeText) {
            return res.status(400).json({ error: 'Both job description and resume text are required.' });
        }

        const { atsScore, suggestions } = await getATSScoreAndSuggestions(jobDescriptionText, resumeText);
        res.json({ atsScore: `${atsScore}%`, suggestions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
});

module.exports = app;
