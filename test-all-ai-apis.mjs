const fetch = require('node-fetch');

async function testProject() {
  try {
    const r = await fetch('http://localhost:3000/api/ai/cashflow-projection');
    const text = await r.text();
    console.log("---- CASHFLOW API ----\n", text);
  } catch(e) { console.error("Cashflow Error:", e.message) }
}
async function testInsights() {
  try {
    const r = await fetch('http://localhost:3000/api/ai/insights');
    const text = await r.text();
    console.log("---- INSIGHTS API ----\n", text);
  } catch(e) { console.error("Insights Error:", e.message) }
}
testProject();
testInsights();
