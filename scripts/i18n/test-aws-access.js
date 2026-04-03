const API_KEY = process.env.AWS_API_KEY;
if (!API_KEY) {
  console.error('Missing AWS_API_KEY env');
  process.exit(1);
}

const url =
  'https://bedrock-runtime.us-east-1.amazonaws.com/model/' +
  'us.anthropic.claude-sonnet-4-20250514-v1:0/converse';

const body = {
  messages: [
    {
      role: 'user',
      content: [{ text: 'Hello' }],
    },
  ],
};

async function main() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Request failed:', res.status, text);
    process.exit(1);
  }

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
