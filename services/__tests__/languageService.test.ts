// Test file for Language Service - Bilingual Enhancement
import { languageService } from '../languageService';

describe('LanguageService - Bilingual Enhancement', () => {
  
  describe('Language Detection', () => {
    test('should detect pure English', () => {
      const result = languageService.detectLanguageAndCorrect('What is the formula for this math problem?');
      expect(result.detection.primaryLanguage).toBe('en');
      expect(result.detection.confidence).toBeGreaterThan(0.7);
    });

    test('should detect pure Malay', () => {
      const result = languageService.detectLanguageAndCorrect('Cikgu, boleh tolong saya dengan soalan matematik ni?');
      expect(result.detection.primaryLanguage).toBe('ms');
      expect(result.detection.confidence).toBeGreaterThan(0.7);
    });

    test('should detect mixed language (code-switching)', () => {
      const result = languageService.detectLanguageAndCorrect('Cikgu, what is the formula for this math problem?');
      expect(result.detection.primaryLanguage).toBe('mixed');
      expect(result.detection.confidence).toBeGreaterThan(0.6);
    });

    test('should detect Malaysian English with particles', () => {
      const result = languageService.detectLanguageAndCorrect('What is the formula lah?');
      expect(result.detection.primaryLanguage).toBe('mixed');
    });
  });

  describe('Typo Correction', () => {
    test('should correct Malay abbreviations', () => {
      const result = languageService.detectLanguageAndCorrect('yg dgn soalan ni');
      expect(result.correctedText).toBe('yang dengan soalan ni');
      expect(result.corrections.length).toBeGreaterThan(0);
      expect(result.corrections[0].type).toBe('abbreviation');
    });

    test('should correct English typos', () => {
      const result = languageService.detectLanguageAndCorrect('wat is the formula?');
      expect(result.correctedText).toBe('what is the formula?');
      expect(result.corrections[0].type).toBe('english');
    });

    test('should correct Malay slang', () => {
      const result = languageService.detectLanguageAndCorrect('Cikgu, math problem ni susah');
      expect(result.correctedText).toBe('Cikgu, matematik problem ni susah');
      expect(result.corrections[0].type).toBe('slang');
    });

    test('should handle multiple corrections', () => {
      const result = languageService.detectLanguageAndCorrect('yg wat dgn math ni?');
      expect(result.corrections.length).toBeGreaterThan(1);
    });
  });

  describe('Bilingual Prompt Creation', () => {
    test('should create English prompt for English input', () => {
      const prompt = languageService.createBilingualPrompt('What is algebra?', 'Mathematics');
      expect(prompt).toContain('LANGUAGE INSTRUCTION: The student is writing in English');
      expect(prompt).toContain('Mathematics');
    });

    test('should create Malay prompt for Malay input', () => {
      const prompt = languageService.createBilingualPrompt('Apa itu algebra?', 'Matematik');
      expect(prompt).toContain('LANGUAGE INSTRUCTION: The student is writing in Bahasa Malaysia');
      expect(prompt).toContain('Matematik');
    });

    test('should create mixed prompt for mixed input', () => {
      const prompt = languageService.createBilingualPrompt('What is algebra dalam matematik?', 'Mathematics');
      expect(prompt).toContain('LANGUAGE INSTRUCTION: The student is using mixed English and Bahasa Malaysia');
    });
  });

  describe('Malaysian Educational Context', () => {
    test('should handle Malaysian exam terms', () => {
      const result = languageService.detectLanguageAndCorrect('SPM math soalan susah');
      expect(result.detection.detectedPatterns).toContain('malay_word');
    });

    test('should recognize subject names in both languages', () => {
      const result1 = languageService.detectLanguageAndCorrect('math problem');
      const result2 = languageService.detectLanguageAndCorrect('matematik soalan');
      expect(result1.detection.primaryLanguage).toBe('en');
      expect(result2.detection.primaryLanguage).toBe('ms');
    });
  });

  describe('Real-world Examples', () => {
    test('should handle student asking for help in Malay', () => {
      const result = languageService.detectLanguageAndCorrect('Cikgu, boleh tolong saya dgn math problem ni?');
      expect(result.detection.primaryLanguage).toBe('ms');
      expect(result.correctedText).toBe('Cikgu, boleh tolong saya dengan matematik problem ni?');
    });

    test('should handle student with typos asking in English', () => {
      const result = languageService.detectLanguageAndCorrect('wat is the formula for this?');
      expect(result.detection.primaryLanguage).toBe('en');
      expect(result.correctedText).toBe('what is the formula for this?');
    });

    test('should handle mixed language request', () => {
      const result = languageService.detectLanguageAndCorrect('explain in BM please');
      expect(result.detection.primaryLanguage).toBe('mixed');
    });

    test('should handle Malaysian English with particles', () => {
      const result = languageService.detectLanguageAndCorrect('This math problem susah lah');
      expect(result.detection.primaryLanguage).toBe('mixed');
    });
  });
});
