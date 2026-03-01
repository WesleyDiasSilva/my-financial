import fs from 'fs';
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
  .then(res => res.json())
  .then(data => {
    const validModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent") && m.name.includes("gemini"));
    console.log("Valid Models supporting generateContent:");
    validModels.forEach(m => console.log(m.name));
  });
