const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { extractTextFromFile, getATSScore } = require('./utils');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/ats-score', upload.fields([{ name: 'jobDescription' }, { name: 'resume' }]), async (req, res) => {
    try {
        let jobDescriptionText = req.body.jobDescriptionText;
        let resumeText = req.body.resumeText;

        // Log file details for debugging
        console.log('Uploaded Files:', req.files);

        if (req.files['jobDescription']) {
            const jobDescriptionPath = req.files['jobDescription'][0].path;
            jobDescriptionText = await extractTextFromFile(jobDescriptionPath);
            fs.unlinkSync(jobDescriptionPath);
        }

        if (req.files['resume']) {
            const resumePath = req.files['resume'][0].path;
            resumeText = await extractTextFromFile(resumePath);
            fs.unlinkSync(resumePath);
        }

        if (!jobDescriptionText || !resumeText) {
            return res.status(400).json({ error: 'Both job description and resume text are required.' });
        }

        const atsScore = await getATSScore(jobDescriptionText, resumeText);
        res.json({ atsScore: `${atsScore}%` });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
