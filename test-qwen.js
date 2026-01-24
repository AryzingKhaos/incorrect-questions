/**
 * Test script for Alibaba Qwen-Plus API with image
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY || process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY;

if (!API_KEY) {
  console.error('❌ No API key found in environment variables');
  process.exit(1);
}

console.log('✅ API Key found:', API_KEY.substring(0, 10) + '...');

const client = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

async function testImageExtraction() {
  try {
    // Read the test image
    const imagePath = path.join(__dirname, 'src/questionImages/WechatIMG212.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log('📸 Image loaded, size:', imageBuffer.length, 'bytes');
    console.log('🔄 Sending request to Qwen-Plus...\n');

    const response = await client.chat.completions.create({
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI assistant helping students digitize their incorrect questions for review and practice.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Carefully analyze the provided image and extract the question text.

**OUTPUT FORMAT:**
Return ONLY valid JSON (no markdown, no code blocks):
{
  "questionText": "The extracted question text here",
  "confidence": 0.95,
  "noiseFiltered": true,
  "errorMessage": null,
  "educationLevel": "middle"
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    console.log('✅ Response received!\n');
    console.log('Raw response:');
    console.log(JSON.stringify(response, null, 2));
    console.log('\n📝 Extracted content:');
    console.log(response.choices[0]?.message?.content);

    // Try to parse JSON
    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        console.log('\n✅ Parsed JSON result:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('\n⚠️  Response is not valid JSON');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

testImageExtraction();
