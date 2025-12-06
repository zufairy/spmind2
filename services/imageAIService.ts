import { aiService } from './aiService';

export interface QuestionDetectionResult {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  text: string;
}

export interface NDJSONStep {
  type: 'meta' | 'step' | 'final';
  recognized_question?: string;
  language?: string;
  detected_subject?: string;
  index?: number;
  content?: string;
  katex?: string | null;
  notes?: string | null;
  answer?: string;
  short_explanation?: string;
  syllabus_alignment?: boolean;
  syllabus_note?: string;
}

export class ImageAIService {
  private static instance: ImageAIService;

  public static getInstance(): ImageAIService {
    if (!ImageAIService.instance) {
      ImageAIService.instance = new ImageAIService();
    }
    return ImageAIService.instance;
  }

  /**
   * Strip base64 prefix to get clean base64 string
   */
  private stripBase64Prefix(base64: string): string {
    return base64.replace(/^data:image\/\w+;base64,/, "");
  }

  /**
   * Validate base64 string format
   */
  private isValidBase64(str: string): boolean {
    try {
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(str) && str.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Process image with streaming NDJSON output for Photomath-like experience
   */
  async processImageWithStreaming(
    imageUri: string,
    detailLevel: 'simple' | 'balanced' | 'detailed' = 'balanced',
    onStep: (step: NDJSONStep) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Validate input
      if (!imageUri || imageUri.trim() === '') {
        onError('Image URI is null or empty');
        return;
      }

      console.log('Processing image with streaming:', imageUri.substring(0, 50) + '...');
      console.log('Detail level:', detailLevel);
      
      // Use the aiService's NDJSON streaming method
      await aiService.sendMessageWithImageNDJSON(
        imageUri,
        detailLevel,
        onStep,
        onComplete,
        onError
      );
    } catch (error) {
      console.error('Image processing error:', error);
      onError(error instanceof Error ? error.message : 'Image processing failed');
    }
  }

  /**
   * Extract question from image using OCR
   */
  async extractQuestionFromImage(imageUri: string): Promise<{ success: boolean; question?: string; error?: string }> {
    try {
      // Validate input
      if (!imageUri || imageUri.trim() === '') {
        return {
          success: false,
          error: 'Image URI is null or empty'
        };
      }

      // Use the aiService's OCR method
      return await aiService.extractQuestionFromImage(imageUri);
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR extraction failed'
      };
    }
  }

  /**
   * Generate streaming solution for a question
   */
  async generateStreamingSolution(
    question: string,
    onStep: (step: NDJSONStep) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Detect language and subject
      const language = this.detectLanguageSimple(question);
      const detectedSubject = this.detectSubject(question, language);
      
      // Emit meta object
      const meta: NDJSONStep = {
        type: 'meta',
        recognized_question: question,
        language: language,
        detected_subject: detectedSubject
      };
      onStep(meta);

      // Build subject-aware system prompt
      const systemPrompt = this.buildSubjectAwarePrompt(detectedSubject, language);
      
      // Generate solution using streaming
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Solve this question step by step: ${question}`
        }
      ];

      // Use aiService streaming
      await aiService.sendMessageStream(
        messages,
        language as 'en' | 'ms',
        false,
        (chunk: string, isComplete: boolean) => {
          if (isComplete) {
            // Parse the complete response into steps
            this.parseSolutionIntoSteps(chunk, onStep);
            onComplete();
          }
        }
      );
    } catch (error) {
      console.error('Solution generation error:', error);
      onError(error instanceof Error ? error.message : 'Solution generation failed');
    }
  }

  /**
   * Simple language detection
   */
  private detectLanguageSimple(text: string): string {
    const lowerText = text.toLowerCase();
    const malayWords = ['saya', 'awak', 'kita', 'mereka', 'ini', 'itu', 'yang', 'dengan', 'untuk', 'dari', 'pada', 'dalam', 'matematik', 'sains', 'sejarah', 'cikgu', 'guru', 'sekolah', 'boleh', 'tidak', 'ya', 'tolong', 'terima', 'kasih'];
    const malayCount = malayWords.filter(word => lowerText.includes(word)).length;
    const totalWords = text.split(/\s+/).length;
    
    if (malayCount / totalWords > 0.3) {
      return 'ms';
    } else if (lowerText.includes('solve') || lowerText.includes('calculate') || lowerText.includes('find')) {
      return 'en';
    } else {
      return 'mixed';
    }
  }

  /**
   * Detect subject from question text
   */
  private detectSubject(question: string, language: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Math indicators
    const mathKeywords = ['tambah', 'tolak', 'darab', 'bahagi', 'plus', 'minus', 'multiply', 'divide', 'equation', 'solve', 'calculate', 'formula', 'algebra', 'geometry', 'trigonometry', 'calculus', '=', '+', '-', '×', '÷', 'x²', '√'];
    if (mathKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'Math';
    }
    
    // Science indicators
    const scienceKeywords = ['sains', 'science', 'sejarah', 'chemistry', 'biology', 'force', 'energy', 'atom', 'molecule', 'cell', 'organism', 'experiment', 'hypothesis', 'theory', 'law'];
    if (scienceKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'Science';
    }
    
    // History indicators
    const historyKeywords = ['sejarah', 'history', 'tahun', 'year', 'war', 'perang', 'independence', 'kemerdekaan', 'prime minister', 'perdana menteri', 'malaysia', 'british', 'japanese'];
    if (historyKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'History';
    }
    
    // Language indicators
    const englishKeywords = ['grammar', 'tenses', 'vocabulary', 'essay', 'paragraph', 'sentence', 'noun', 'verb', 'adjective'];
    const malayKeywords = ['tatabahasa', 'imbuhan', 'kata', 'ayat', 'perenggan', 'karangan'];
    
    if (englishKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'English';
    }
    if (malayKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'BahasaMelayu';
    }
    
    return 'Other';
  }

  /**
   * Build subject-aware system prompt
   */
  private buildSubjectAwarePrompt(subject: string, language: string): string {
    const basePrompt = `You are TutoPal AI, a bilingual Malaysian study assistant for students under 17.

CRITICAL: You must output NDJSON format - one JSON object per line. Each line must be valid JSON.

OUTPUT FORMAT:
1. First line: {"type":"meta","recognized_question":"...","language":"${language}","detected_subject":"${subject}"}
2. Then zero or more step objects: {"type":"step","index":1,"content":"short text (≤150 chars)","katex":"optional LaTeX or null","notes":"optional"}
3. Final line: {"type":"final","answer":"short answer","short_explanation":"one sentence","syllabus_alignment":true/false,"syllabus_note":"if false, brief note"}

RULES:
- Each step content must be ≤150 characters
- Use katex field for math equations
- Be concise and age-appropriate
- Follow KSSR/KSSM syllabus when possible
- If outside syllabus, set syllabus_alignment:false`;

    switch (subject) {
      case 'Math':
        return basePrompt + `

MATH-SPECIFIC:
- Show numeric calculation steps
- Use LaTeX in katex field for equations
- Each step should show the operation clearly
- Example: {"type":"step","index":1,"content":"Convert words to numbers: dua = 2, tambah = +","katex":null}
- Example: {"type":"step","index":2,"content":"Compute: 2 + 2 = 4","katex":"2+2=4"}`;

      case 'Science':
        return basePrompt + `

SCIENCE-SPECIFIC:
- Use numbered bullet points
- Include key scientific terms
- Show cause-effect relationships
- Example: {"type":"step","index":1,"content":"Light enters Earth's atmosphere","katex":null}
- Example: {"type":"step","index":2,"content":"Blue light scatters more than red","katex":null}`;

      case 'History':
        return basePrompt + `

HISTORY-SPECIFIC:
- Give direct factual answer first
- Include timeline bullet points (year: event)
- Show cause/effect relationships
- Example: {"type":"step","index":1,"content":"Tunku Abdul Rahman (1957-1970)","katex":null}
- Example: {"type":"step","index":2,"content":"Led independence negotiations with British","katex":null}`;

      case 'English':
      case 'BahasaMelayu':
        return basePrompt + `

LANGUAGE-SPECIFIC:
- Show grammar corrections or explanations
- Use numbered points for structure
- Include examples
- Example: {"type":"step","index":1,"content":"Identify subject: 'The cat'","katex":null}
- Example: {"type":"step","index":2,"content":"Identify verb: 'is sleeping'","katex":null}`;

      default:
        return basePrompt + `

GENERIC-SPECIFIC:
- Use numbered bullet points
- Keep explanations concise
- Show logical progression
- Example: {"type":"step","index":1,"content":"Identify the main concept","katex":null}
- Example: {"type":"step","index":2,"content":"Apply the concept to solve","katex":null}`;
    }
  }

  /**
   * Parse solution response into NDJSON steps
   */
  private parseSolutionIntoSteps(response: string, onStep: (step: NDJSONStep) => void): void {
    const lines = response.split('\n').filter(line => line.trim());
    let stepIndex = 1;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Match step patterns
      if (trimmedLine.match(/^Step\s+\d+:/i) || trimmedLine.match(/^\d+\./)) {
        const title = trimmedLine.replace(/^(Step\s+\d+:|^\d+\.)\s*/, '').trim();
        const content = lines[index + 1] || '';
        
        const step: NDJSONStep = {
          type: 'step',
          index: stepIndex++,
          content: (title + ' ' + content).trim().substring(0, 150),
          katex: null,
          notes: null
        };
        onStep(step);
      } else if (trimmedLine.toLowerCase().includes('final answer') || trimmedLine.toLowerCase().includes('answer:')) {
        const final: NDJSONStep = {
          type: 'final',
          answer: trimmedLine,
          short_explanation: 'Solution completed',
          syllabus_alignment: true,
          syllabus_note: ''
        };
        onStep(final);
      }
    });
  }

  // Mock function for question detection - in real implementation, this would use ML Kit
  async detectQuestions(imageBase64: string): Promise<QuestionDetectionResult[]> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock detected questions - in real app, this would use ML Kit Text Recognition
    return [
      {
        id: '1',
        x: 0.1,
        y: 0.2,
        width: 0.8,
        height: 0.15,
        confidence: 0.95,
        text: 'What is the derivative of x²?'
      },
      {
        id: '2',
        x: 0.1,
        y: 0.4,
        width: 0.8,
        height: 0.12,
        confidence: 0.87,
        text: 'Solve for x: 2x + 5 = 13'
      },
      {
        id: '3',
        x: 0.1,
        y: 0.6,
        width: 0.8,
        height: 0.1,
        confidence: 0.92,
        text: 'Explain the process of photosynthesis'
      }
    ];
  }

  // Process cropped image to extract text and get AI answer
  async processQuestionImage(imageBase64: string, questionText: string): Promise<string> {
    try {
      const prompt = `You are a helpful tutor. Please answer this question clearly and step-by-step:

Question: ${questionText}

Please provide a detailed, educational answer that helps the student understand the concept. Include examples and explanations.`;

      const messages = [{ role: 'user' as const, content: prompt }];
      const response = await aiService.sendMessage(messages, 'en');
      
      if (response.success && response.message) {
        return response.message;
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error processing question image:', error);
      throw new Error('Failed to process question');
    }
  }

  // Crop image based on question coordinates
  async cropImage(
    originalImageBase64: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<string> {
    // In a real implementation, this would use image processing libraries
    // For now, we'll return the original image
    return originalImageBase64;
  }
}

export const imageAIService = ImageAIService.getInstance();
