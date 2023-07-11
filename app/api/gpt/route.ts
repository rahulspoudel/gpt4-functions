import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_TOKEN || '',
});

// Another options is to use the OPENAI JS SDK directly
const KEY = process.env.OPENAI_API_KEY || '';
const base_uri = 'https://api.openai.com/v1/chat/completions';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${KEY}`,
};

// Functions API supports GPT 3.5 Turbo and GPT 4
// GPT 4 is better
const data = {
  model: 'gpt-4',
};

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { query } = await req.json();

    const requestData = {
      ...data,
      messages: [{ role: 'user', content: query }],
      functons: [
        {
          name: 'createMusic',
          description:
            'call this function if the request asks to generate music',

          paramaters: {
            type: 'object',
            // These are the collection of properties as specified in the replicate music generator model API specification https://replicate.com/facebookresearch/musicgen
            // The main goal is to get the input from the user in natural language and convert it to the format that the model expects, similar for createImage below
            properties: {
              prompt: {
                type: 'string',
                description: 'the exact prompt passed in',
              },
              duration: {
                type: 'number',
                description:
                  'if the user defines a length for audio or music, or for a duration, return the number only',
              },
            },
          },
        },
        {
          name: 'createImage',
          description:
            'call this function if the request asks to generate an image',
          paramaters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'the exact prompt passed in',
              },
            },
          },
        },
      ],
    };

    const response = await fetch(base_uri, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    const json = await response.json();
    // Get first item in the array
    let choice = json.choices[0];

    const { function_call } = choice;
    console.log('function_call', function_call);

    // If there is function call, we can call replicate
    // Else we return the info returned from openai
    if (function_call) {
      const args = JSON.parse(function_call.arguments);
    } else {
      return NextResponse.json({ data: choice.message.content, type: 'text' });
    }
  } catch (e) {
    console.log('error: ', e);
    return NextResponse.json({ error: e });
  }
}
