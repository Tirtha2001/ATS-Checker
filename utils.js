const fs = require('fs');
const pdfParse = require('pdf-parse');
const docxParser = require('docx-parser');
const natural = require('natural');

async function extractTextFromFile(file) {
    const { path, mimetype } = file;

    if (mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(path);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return new Promise((resolve, reject) => {
            docxParser.parseDocx(path, (data) => {
                resolve(data);
            });
        });
    } else {
        throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
    }
}

async function getATSScoreAndSuggestions(jobDescriptionText, resumeText) {
    const tokenizer = new natural.WordTokenizer();
    const jobTokens = tokenizer.tokenize(jobDescriptionText.toLowerCase());
    const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());

    // Frequency maps for both job description and resume
    const jobFreq = jobTokens.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});
    const resumeFreq = resumeTokens.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});

    const jobKeywords = Object.keys(jobFreq);
    let matchedKeywords = 0;
    let missingKeywords = [];

    jobKeywords.forEach((word) => {
        if (resumeFreq[word]) {
            matchedKeywords += Math.min(jobFreq[word], resumeFreq[word]);
        } else {
            missingKeywords.push(word);
        }
    });

    const totalJobKeywords = jobTokens.length;
    const score = (matchedKeywords / totalJobKeywords) * 100;

    // Suggestions: Highlight missing keywords in a user-friendly message
    const suggestions = missingKeywords.length
        ? `Consider including these keywords to improve your match score: ${missingKeywords.join(', ')}.`
        : "Your resume matches most of the job description's key requirements!";

    return {
        atsScore: parseFloat(score.toFixed(2)),
        suggestions,
    };
}

module.exports = { extractTextFromFile, getATSScoreAndSuggestions };
