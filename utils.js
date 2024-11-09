const fs = require('fs');
const pdfParse = require('pdf-parse');
const docxParser = require('docx-parser');
const natural = require('natural');
const path = require('path');

/**
 * Extracts text from PDF or DOCX files.
 * @param {string} filePath - Path to the file (PDF or DOCX).
 * @returns {Promise<string>} - Extracted text.
 */
async function extractTextFromFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    console.log(`Extracting text from file: ${filePath} with extension: ${extension}`);

    if (extension === '.pdf') {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            throw new Error(`Error processing PDF file: ${error.message}`);
        }
    } else if (extension === '.docx') {
        try {
            return new Promise((resolve, reject) => {
                docxParser.parseDocx(filePath, (data, error) => {
                    if (error) reject(new Error(`Error processing DOCX file: ${error.message}`));
                    resolve(data);
                });
            });
        } catch (error) {
            throw new Error(`Error processing DOCX file: ${error.message}`);
        }
    } else {
        throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
    }
}

function getATSScore(jobDescriptionText, resumeText) {
    const tokenizer = new natural.WordTokenizer();
    const jobTokens = tokenizer.tokenize(jobDescriptionText.toLowerCase());
    const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());

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
    jobKeywords.forEach((word) => {
        if (resumeFreq[word]) {
            matchedKeywords += Math.min(jobFreq[word], resumeFreq[word]);
        }
    });

    const totalJobKeywords = jobTokens.length;
    const score = (matchedKeywords / totalJobKeywords) * 100;

    return parseFloat(score.toFixed(2));
}

module.exports = { extractTextFromFile, getATSScore };
