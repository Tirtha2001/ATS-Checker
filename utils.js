const fs = require('fs');
const pdfParse = require('pdf-parse');
const docxParser = require('docx-parser');
const cohere = require('cohere-ai'); // Import Cohere SDK
require('dotenv').config(); // Load environment variables from .env file

// Initialize Cohere client
const cohereClient = new cohere.CohereClient({token:process.env.COHERE_API_KEY});

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
    const prompt = `
        Job Description:
        ${jobDescriptionText}

        Resume:
        ${resumeText}

        Analyze the resume and job description. Provide an ATS score based on how well the resume matches the job description. Also, suggest any improvements for the resume to better align with the job description.
    `;

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            const response = await cohereClient.chat({
                model: 'command-r-plus',  // Using the 'xlarge' model for better performance
                // messages: [{ role: 'user', content: prompt }],
                message:prompt,
                max_tokens: 200,
                temperature: 0.6,
            });

            const atsScore = response.text.trim().match(/ATS Score: (\d+\.?\d*)/);
            const atsScoreValue = atsScore ? atsScore[1] : "N/A";
            const suggestions = response.text.trim();

            return {
                atsScore: atsScoreValue,
                suggestions: suggestions || "Your resume aligns well with the job description requirements!",
            };
        } catch (error) {
            if (error.response && error.response.status === 429) {
                attempts++;
                const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
                console.log(`Rate limit hit. Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }

    throw new Error('Exceeded maximum retry attempts');
}

module.exports = { extractTextFromFile, getATSScoreAndSuggestions };
