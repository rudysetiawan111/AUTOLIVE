import { openai } from './openai';

export async function generateAIContent(keyword: string) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Buatkan konten viral dari keyword: ${keyword}
        Format:
        - Judul
        - Caption
        - Hashtag
        - Hook 3 detik pertama`
      }
    ]
  });

  const text = res.choices[0].message.content || '';

  return {
    raw: text
  };
}
