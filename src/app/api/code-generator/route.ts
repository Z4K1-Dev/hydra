import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { prompt, language, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const systemPrompt = `You are an expert AI code assistant similar to OpenAI Codex. 
Your task is to generate high-quality, efficient, and well-documented code based on the user's requirements.

Guidelines:
1. Generate clean, modern, and maintainable code
2. Include appropriate comments and documentation
3. Follow best practices for the specified language
4. Provide explanations for complex logic
5. Include error handling where appropriate
6. Use modern language features and patterns
7. Consider performance and scalability

Language: ${language || 'JavaScript'}
Context: ${context || 'General purpose coding'}

Please provide the code in a markdown code block with the appropriate language syntax highlighting.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const generatedCode = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      code: generatedCode,
      prompt,
      language
    });

  } catch (error) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}