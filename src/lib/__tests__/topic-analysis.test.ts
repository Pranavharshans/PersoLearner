/**
 * Unit tests for Topic Analysis and Prompt Generation Module
 */

import {
  analyzeTopic,
  generatePrompt,
  generateUserPrompt,
  validateTopic,
  suggestTopicImprovements,
  TopicAnalysis,
  PromptOptions
} from '../topic-analysis';

describe('Topic Analysis Module', () => {
  describe('analyzeTopic', () => {
    test('should detect mathematical topics correctly', () => {
      const result = analyzeTopic('Pythagorean theorem with proof');
      
      expect(result.suggestedStyle).toBe('mathematical');
      expect(result.category).toBe('Mathematics');
      expect(result.keywords).toContain('theorem');
      expect(result.keywords).toContain('proof');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should detect scientific topics correctly', () => {
      const result = analyzeTopic('DNA structure and replication');
      
      expect(result.suggestedStyle).toBe('scientific');
      expect(result.category).toBe('Science');
      expect(result.keywords).toContain('dna');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should detect complexity levels correctly', () => {
      const beginnerResult = analyzeTopic('Basic introduction to fractions');
      expect(beginnerResult.detectedComplexity).toBe('beginner');

      const advancedResult = analyzeTopic('Advanced calculus derivation');
      expect(advancedResult.detectedComplexity).toBe('advanced');

      const intermediateResult = analyzeTopic('Linear algebra concepts');
      expect(intermediateResult.detectedComplexity).toBe('intermediate');
    });

    test('should estimate duration appropriately', () => {
      const shortTopic = analyzeTopic('Basic addition');
      const longTopic = analyzeTopic('Comprehensive analysis of quantum mechanics principles');
      
      expect(shortTopic.estimatedDuration).toBeLessThan(longTopic.estimatedDuration);
      expect(shortTopic.estimatedDuration).toBeGreaterThanOrEqual(30);
      expect(longTopic.estimatedDuration).toBeLessThanOrEqual(180);
    });
  });

  describe('generatePrompt', () => {
    test('should generate well-formed prompt for mathematical topic', () => {
      const topic = 'Pythagorean theorem';
      const prompt = generatePrompt(topic);
      
      expect(prompt).toContain(topic);
      expect(prompt).toContain('Manim script');
      expect(prompt).toContain('from manim import *');
      expect(prompt).toContain('MainScene');
      expect(prompt).toContain('construct(self)');
      expect(prompt).toContain('mathematical');
    });

    test('should generate well-formed prompt for scientific topic', () => {
      const topic = 'DNA replication process';
      const prompt = generatePrompt(topic);
      
      expect(prompt).toContain(topic);
      expect(prompt).toContain('scientific');
      expect(prompt).toContain('ANALYSIS CONTEXT');
      expect(prompt).toContain('Science');
    });

    test('should respect custom options', () => {
      const topic = 'Basic math';
      const options: PromptOptions = {
        complexity: 'advanced',
        style: 'mathematical',
        duration: 120,
        includeExamples: false,
        emphasizeVisuals: false
      };
      
      const prompt = generatePrompt(topic, options);
      
      expect(prompt).toContain('ADVANCED');
      expect(prompt).toContain('MATHEMATICAL');
      expect(prompt).toContain('120 seconds');
      expect(prompt).not.toContain('Content Guidelines');
      expect(prompt).not.toContain('Visual Emphasis');
    });

    test('should include examples when requested', () => {
      const topic = 'Pythagorean theorem';
      const options: PromptOptions = {
        includeExamples: true
      };
      
      const prompt = generatePrompt(topic, options);
      expect(prompt).toContain('Content Guidelines');
      expect(prompt).toContain('concrete examples');
    });

    test('should emphasize visuals when requested', () => {
      const topic = 'Physics concepts';
      const options: PromptOptions = {
        emphasizeVisuals: true
      };
      
      const prompt = generatePrompt(topic, options);
      expect(prompt).toContain('Visual Emphasis');
      expect(prompt).toContain('visual explanations');
    });

    test('should handle different complexity levels', () => {
      const topic = 'Mathematics';
      
      const beginnerPrompt = generatePrompt(topic, { complexity: 'beginner' });
      const advancedPrompt = generatePrompt(topic, { complexity: 'advanced' });
      
      expect(beginnerPrompt).toContain('simple concepts');
      expect(beginnerPrompt).toContain('minimal technical jargon');
      
      expect(advancedPrompt).toContain('sophisticated concepts');
      expect(advancedPrompt).toContain('technical depth');
    });

    test('should handle different styles', () => {
      const topic = 'Test topic';
      
      const mathPrompt = generatePrompt(topic, { style: 'mathematical' });
      const sciencePrompt = generatePrompt(topic, { style: 'scientific' });
      const generalPrompt = generatePrompt(topic, { style: 'general' });
      
      expect(mathPrompt).toContain('mathematical equations');
      expect(mathPrompt).toContain('MathTex');
      
      expect(sciencePrompt).toContain('scientific diagrams');
      expect(sciencePrompt).toContain('real-world applications');
      
      expect(generalPrompt).toContain('versatile approach');
      expect(generalPrompt).toContain('clear communication');
    });
  });

  describe('generateUserPrompt', () => {
    test('should generate basic user prompt', () => {
      const topic = 'Test topic';
      const userPrompt = generateUserPrompt(topic);
      
      expect(userPrompt).toContain(topic);
      expect(userPrompt).toContain('Generate a Manim script');
      expect(userPrompt).toContain('Educational');
      expect(userPrompt).toContain('visually engaging');
    });

    test('should include additional context when provided', () => {
      const topic = 'Test topic';
      const context = 'Focus on practical applications';
      const userPrompt = generateUserPrompt(topic, context);
      
      expect(userPrompt).toContain(context);
      expect(userPrompt).toContain('Additional context');
    });
  });

  describe('validateTopic', () => {
    test('should validate correct topics', () => {
      const validTopics = [
        'Pythagorean theorem',
        'DNA structure',
        'Basic algebra concepts',
        'Introduction to physics'
      ];
      
      validTopics.forEach(topic => {
        const result = validateTopic(topic);
        expect(result.isValid).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });

    test('should reject empty or too short topics', () => {
      const invalidTopics = ['', '  ', 'ab'];
      
      invalidTopics.forEach(topic => {
        const result = validateTopic(topic);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    test('should reject too long topics', () => {
      const longTopic = 'a'.repeat(201);
      const result = validateTopic(longTopic);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('less than 200 characters');
    });

    test('should reject inappropriate content', () => {
      const inappropriateTopic = 'How to create harmful content';
      const result = validateTopic(inappropriateTopic);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('inappropriate content');
    });
  });

  describe('suggestTopicImprovements', () => {
    test('should suggest improvements for vague topics', () => {
      const vagueTopic = 'stuff';
      const suggestions = suggestTopicImprovements(vagueTopic);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('more specific'))).toBe(true);
    });

    test('should suggest improvements for short topics', () => {
      const shortTopic = 'math';
      const suggestions = suggestTopicImprovements(shortTopic);
      
      expect(suggestions.some(s => s.includes('more detail'))).toBe(true);
    });

    test('should suggest action words', () => {
      const topic = 'calculus concepts';
      const suggestions = suggestTopicImprovements(topic);
      
      expect(suggestions.some(s => s.includes('action words'))).toBe(true);
    });

    test('should suggest specific concepts', () => {
      const topic = 'general learning';
      const suggestions = suggestTopicImprovements(topic);
      
      expect(suggestions.some(s => s.includes('specific concepts'))).toBe(true);
    });

    test('should return fewer suggestions for good topics', () => {
      const goodTopic = 'Explain the Pythagorean theorem with mathematical proof';
      const suggestions = suggestTopicImprovements(goodTopic);
      
      expect(suggestions.length).toBeLessThan(3);
    });
  });

  describe('Integration tests', () => {
    test('should work end-to-end for complex topics', () => {
      const complexTopics = [
        'Advanced quantum mechanics principles',
        'Basic introduction to fractions for beginners',
        'DNA replication and protein synthesis',
        'Calculus derivatives and their applications'
      ];
      
      complexTopics.forEach(topic => {
        // Validate topic
        const validation = validateTopic(topic);
        expect(validation.isValid).toBe(true);
        
        // Analyze topic
        const analysis = analyzeTopic(topic);
        expect(analysis.topic).toBe(topic);
        expect(analysis.confidence).toBeGreaterThan(0);
        
        // Generate prompt
        const prompt = generatePrompt(topic);
        expect(prompt).toContain(topic);
        expect(prompt.length).toBeGreaterThan(500); // Should be comprehensive
        
        // Generate user prompt
        const userPrompt = generateUserPrompt(topic);
        expect(userPrompt).toContain(topic);
        
        // Get suggestions
        const suggestions = suggestTopicImprovements(topic);
        expect(Array.isArray(suggestions)).toBe(true);
      });
    });
  });
}); 