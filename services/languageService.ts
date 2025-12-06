// Language Service for Malaysian Bilingual Chat Enhancement
export interface LanguageDetectionResult {
  primaryLanguage: 'en' | 'ms' | 'mixed';
  confidence: number;
  detectedPatterns: string[];
  suggestedResponse: 'en' | 'ms' | 'mixed';
}

export interface TypoCorrection {
  original: string;
  corrected: string;
  confidence: number;
  type: 'malay' | 'english' | 'abbreviation' | 'slang';
}

export class LanguageService {
  private static instance: LanguageService;

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  // Malaysian English and Malay common words/patterns
  private malayWords = new Set([
    'saya', 'awak', 'kita', 'mereka', 'ini', 'itu', 'yang', 'dengan', 'untuk', 'dari', 'pada', 'dalam', 'atas', 'bawah',
    'matematik', 'sains', 'sejarah', 'geografi', 'bahasa', 'melayu', 'inggeris', 'cikgu', 'guru', 'sekolah', 'kelas',
    'boleh', 'tidak', 'ya', 'tidak', 'tolong', 'terima', 'kasih', 'maaf', 'sila', 'jangan', 'mesti', 'perlu',
    'belajar', 'mengajar', 'membaca', 'menulis', 'menjawab', 'soalan', 'jawapan', 'kerja', 'rumah', 'tugasan',
    'ujian', 'peperiksaan', 'markah', 'gred', 'lulus', 'gagal', 'baik', 'buruk', 'mudah', 'susah', 'sukar',
    'pt3', 'spm', 'upsr', 'pmr', 'stpm', 'matrikulasi', 'universiti', 'kolej', 'institut'
  ]);

  private malayParticles = new Set(['lah', 'la', 'kan', 'je', 'saja', 'sahaja', 'pun', 'juga', 'tapi', 'tetapi']);

  private malayAbbreviations = new Map([
    ['yg', 'yang'], ['dgn', 'dengan'], ['dlm', 'dalam'], ['utk', 'untuk'], ['dr', 'dari'], ['pd', 'pada'],
    ['bg', 'bagi'], ['sbb', 'sebab'], ['tp', 'tapi'], ['jg', 'juga'], ['jgn', 'jangan'], ['mcm', 'macam'],
    ['nk', 'nak'], ['x', 'tidak'], ['tak', 'tidak'], ['bkn', 'bukan'], ['sgt', 'sangat'], ['byk', 'banyak'],
    ['skrg', 'sekarang'], ['tdk', 'tidak'], ['mst', 'mesti'], ['prlu', 'perlu'], ['blh', 'boleh']
  ]);

  private malaySlang = new Map([
    ['cikgu', 'guru'], ['guru', 'cikgu'], ['skolah', 'sekolah'], ['skul', 'sekolah'], ['kls', 'kelas'],
    ['math', 'matematik'], ['sci', 'sains'], ['hist', 'sejarah'], ['geo', 'geografi'], ['bm', 'bahasa melayu'],
    ['bi', 'bahasa inggeris'], ['eng', 'bahasa inggeris'], ['malay', 'bahasa melayu']
  ]);

  private englishTypos = new Map([
    ['wat', 'what'], ['wht', 'what'], ['hw', 'how'], ['whr', 'where'], ['wen', 'when'], ['y', 'why'],
    ['thnks', 'thanks'], ['thx', 'thanks'], ['pls', 'please'], ['plz', 'please'], ['u', 'you'], ['ur', 'your'],
    ['r', 'are'], ['n', 'and'], ['b', 'be'], ['c', 'see'], ['2', 'to'], ['4', 'for'], ['8', 'ate'],
    ['luv', 'love'], ['nite', 'night'], ['thru', 'through'], ['tho', 'though'], ['coz', 'because'],
    ['gonna', 'going to'], ['wanna', 'want to'], ['gotta', 'got to'], ['kinda', 'kind of']
  ]);

  private malaysianEnglishTerms = new Set([
    'lah', 'la', 'kan', 'meh', 'lor', 'mah', 'one', 'got', 'already', 'can', 'cannot', 'donch', 'donch know',
    'makan', 'balik', 'pergi', 'datang', 'boleh', 'tidak', 'suka', 'takut', 'marah', 'gembira', 'sedih'
  ]);

  /**
   * Detect language and provide smart typo handling
   */
  detectLanguageAndCorrect(text: string): { 
    detection: LanguageDetectionResult; 
    correctedText: string; 
    corrections: TypoCorrection[] 
  } {
    const words = text.toLowerCase().split(/\s+/);
    const corrections: TypoCorrection[] = [];
    let correctedWords: string[] = [];
    
    let malayCount = 0;
    let englishCount = 0;
    let mixedIndicators = 0;
    const detectedPatterns: string[] = [];

    // Process each word
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      let correctedWord = word;
      let correction: TypoCorrection | null = null;

      // Check for Malay abbreviations
      if (this.malayAbbreviations.has(cleanWord)) {
        const fullForm = this.malayAbbreviations.get(cleanWord)!;
        correctedWord = word.replace(cleanWord, fullForm);
        correction = {
          original: word,
          corrected: correctedWord,
          confidence: 0.9,
          type: 'abbreviation'
        };
        malayCount++;
        detectedPatterns.push('malay_abbreviation');
      }
      // Check for Malay slang
      else if (this.malaySlang.has(cleanWord)) {
        const standardForm = this.malaySlang.get(cleanWord)!;
        correctedWord = word.replace(cleanWord, standardForm);
        correction = {
          original: word,
          corrected: correctedWord,
          confidence: 0.8,
          type: 'slang'
        };
        malayCount++;
        detectedPatterns.push('malay_slang');
      }
      // Check for English typos
      else if (this.englishTypos.has(cleanWord)) {
        const correctForm = this.englishTypos.get(cleanWord)!;
        correctedWord = word.replace(cleanWord, correctForm);
        correction = {
          original: word,
          corrected: correctedWord,
          confidence: 0.85,
          type: 'english'
        };
        englishCount++;
        detectedPatterns.push('english_typo');
      }
      // Check for Malay words
      else if (this.malayWords.has(cleanWord)) {
        malayCount++;
        detectedPatterns.push('malay_word');
      }
      // Check for Malay particles
      else if (this.malayParticles.has(cleanWord)) {
        malayCount++;
        detectedPatterns.push('malay_particle');
      }
      // Check for Malaysian English terms
      else if (this.malaysianEnglishTerms.has(cleanWord)) {
        mixedIndicators++;
        detectedPatterns.push('malaysian_english');
      }
      // Check for common English words
      else if (this.isEnglishWord(cleanWord)) {
        englishCount++;
        detectedPatterns.push('english_word');
      }

      if (correction) {
        corrections.push(correction);
      }
      correctedWords.push(correctedWord);
    }

    // Determine primary language
    const totalWords = words.length;
    const malayRatio = malayCount / totalWords;
    const englishRatio = englishCount / totalWords;
    const mixedRatio = mixedIndicators / totalWords;

    let primaryLanguage: 'en' | 'ms' | 'mixed';
    let confidence: number;
    let suggestedResponse: 'en' | 'ms' | 'mixed';

    if (mixedRatio > 0.3 || (malayRatio > 0.2 && englishRatio > 0.2)) {
      primaryLanguage = 'mixed';
      confidence = Math.min(0.9, 0.6 + mixedRatio);
      suggestedResponse = 'mixed';
    } else if (malayRatio > englishRatio) {
      primaryLanguage = 'ms';
      confidence = Math.min(0.95, 0.7 + malayRatio);
      suggestedResponse = 'ms';
    } else {
      primaryLanguage = 'en';
      confidence = Math.min(0.95, 0.7 + englishRatio);
      suggestedResponse = 'en';
    }

    // Special cases for Malaysian context
    if (text.toLowerCase().includes('cikgu') || text.toLowerCase().includes('guru')) {
      primaryLanguage = 'ms';
      confidence = Math.max(confidence, 0.8);
      suggestedResponse = 'ms';
    }

    if (text.toLowerCase().includes('lah') || text.toLowerCase().includes('la') || text.toLowerCase().includes('kan')) {
      if (primaryLanguage === 'en') {
        primaryLanguage = 'mixed';
        suggestedResponse = 'mixed';
      }
    }

    return {
      detection: {
        primaryLanguage,
        confidence,
        detectedPatterns,
        suggestedResponse
      },
      correctedText: correctedWords.join(' '),
      corrections
    };
  }

  /**
   * Create enhanced bilingual prompt for AI
   */
  createBilingualPrompt(userText: string, subject: string): string {
    const { detection, correctedText } = this.detectLanguageAndCorrect(userText);
    
    const languageInstructions = this.getLanguageInstructions(detection);
    const subjectContext = this.getSubjectContext(subject, detection.primaryLanguage);
    
    return `You are a supportive Malaysian teacher who is naturally bilingual in English and Bahasa Malaysia. You understand Malaysian students' language patterns, including code-switching, typos, abbreviations, and local expressions.

${languageInstructions}

${subjectContext}

TEACHING STYLE:
- Answer questions directly and immediately as a teacher
- Be talkative, supportive, and encouraging
- Ask follow-up questions to engage the student
- Always offer to help further and guide them
- Be enthusiastic about teaching and learning
- Give practical examples and real-world applications
- Encourage questions and curiosity
- Be patient with spelling mistakes and informal language
- Understand Malaysian slang, abbreviations, and typos naturally

FORMATTING REQUIREMENTS:
- Use **bold** for important terms, key concepts, and main points
- Use _underline_ for definitions, formulas, and critical information
- Use **bold** for subject names, chapter titles, and exam topics
- Use _underline_ for Malaysian-specific terms, places, and cultural references
- Use **bold** for step-by-step instructions and numbered points
- Use _underline_ for important dates, names, and facts

MALAYSIAN EDUCATIONAL CONTEXT:
- Use proper Malaysian curriculum terminology
- Reference Malaysian exam systems (PT3, SPM, UPSR, STPM)
- Include Malaysian examples and local context
- Use appropriate Malaysian terminology for both languages
- Understand subject names in both languages (Math/Matematik, Science/Sains, etc.)

Remember: You are their teacher, so be direct, helpful, and always ready to guide them further. Don't ask for their name - just start teaching! Make everything easy to understand and relevant to Malaysian students.

User question: ${correctedText}`;
  }

  private getLanguageInstructions(detection: LanguageDetectionResult): string {
    switch (detection.primaryLanguage) {
      case 'ms':
        return `LANGUAGE INSTRUCTION: The student is writing in Bahasa Malaysia. Respond naturally in Bahasa Malaysia using proper educational terminology. Be patient with any typos or informal spellings.`;
      case 'mixed':
        return `LANGUAGE INSTRUCTION: The student is using mixed English and Bahasa Malaysia (code-switching). Respond naturally in the same mixed style, maintaining educational clarity while being conversational.`;
      default:
        return `LANGUAGE INSTRUCTION: The student is writing in English. Respond in English using Malaysian educational context and terminology. Be understanding of any typos or informal language.`;
    }
  }

  private getSubjectContext(subject: string, language: 'en' | 'ms' | 'mixed'): string {
    const subjectMap = {
      'Matematik': { en: 'Mathematics', ms: 'Matematik' },
      'Sains': { en: 'Science', ms: 'Sains' },
      'Bahasa Melayu': { en: 'Malay Language', ms: 'Bahasa Melayu' },
      'English': { en: 'English Language', ms: 'Bahasa Inggeris' },
      'Sejarah': { en: 'History', ms: 'Sejarah' },
      'Geografi': { en: 'Geography', ms: 'Geografi' }
    };

    const subjectInfo = subjectMap[subject as keyof typeof subjectMap] || { en: subject, ms: subject };
    
    if (language === 'ms') {
      return `SUBJECT CONTEXT: You are teaching ${subjectInfo.ms}. Use proper Malay educational terminology and concepts.`;
    } else if (language === 'mixed') {
      return `SUBJECT CONTEXT: You are teaching ${subject} (${subjectInfo.en}/${subjectInfo.ms}). Use appropriate terminology in both languages as needed.`;
    } else {
      return `SUBJECT CONTEXT: You are teaching ${subjectInfo.en}. Use proper English educational terminology with Malaysian context.`;
    }
  }

  private isEnglishWord(word: string): boolean {
    // Simple English word detection - in a real implementation, you'd use a proper dictionary
    const commonEnglishWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
      'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
      'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
      'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'am', 'is', 'are', 'was', 'were', 'be', 'being', 'been'
    ]);
    
    return commonEnglishWords.has(word.toLowerCase());
  }
}

export const languageService = LanguageService.getInstance();
