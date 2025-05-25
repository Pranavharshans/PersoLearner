/**
 * Topic Analysis and Prompt Generation Module
 * 
 * This module provides functions for analyzing user topics and generating
 * optimized prompts for Manim script generation via OpenRouter API.
 */

export interface TopicAnalysis {
  topic: string;
  detectedComplexity: 'beginner' | 'intermediate' | 'advanced';
  suggestedStyle: 'mathematical' | 'scientific' | 'general';
  estimatedDuration: number;
  keywords: string[];
  category: string;
  confidence: number;
}

export interface PromptOptions {
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  style?: 'mathematical' | 'scientific' | 'general';
  duration?: number;
  includeExamples?: boolean;
  emphasizeVisuals?: boolean;
}

/**
 * Analyzes a user-provided topic to determine its characteristics
 * and suggest optimal parameters for script generation.
 */
export function analyzeTopic(topic: string): TopicAnalysis {
  const normalizedTopic = topic.toLowerCase().trim();
  
  // Mathematical keywords and patterns
  const mathKeywords = [
    'theorem', 'proof', 'equation', 'formula', 'calculus', 'algebra', 'geometry',
    'trigonometry', 'derivative', 'integral', 'matrix', 'vector', 'function',
    'polynomial', 'logarithm', 'exponential', 'sine', 'cosine', 'tangent',
    'pythagorean', 'fibonacci', 'prime', 'factorial', 'probability', 'statistics'
  ];
  
  // Scientific keywords and patterns
  const scienceKeywords = [
    'physics', 'chemistry', 'biology', 'atom', 'molecule', 'cell', 'dna',
    'evolution', 'gravity', 'force', 'energy', 'momentum', 'wave', 'light',
    'electromagnetic', 'quantum', 'relativity', 'newton', 'einstein', 'darwin',
    'periodic table', 'chemical reaction', 'photosynthesis', 'ecosystem'
  ];
  
  // Advanced complexity indicators
  const advancedIndicators = [
    'advanced', 'complex', 'detailed', 'comprehensive', 'in-depth', 'proof',
    'derivation', 'analysis', 'research', 'quantum', 'relativity', 'calculus',
    'differential', 'integral', 'topology', 'abstract'
  ];
  
  // Beginner complexity indicators
  const beginnerIndicators = [
    'basic', 'simple', 'introduction', 'beginner', 'elementary', 'fundamental',
    'overview', 'basics', 'simple explanation', 'for kids', 'easy'
  ];
  
  // Extract keywords from topic
  const words = normalizedTopic.split(/\s+/);
  const keywords: string[] = [];
  
  // Detect mathematical content
  const mathMatches = mathKeywords.filter(keyword => 
    normalizedTopic.includes(keyword)
  );
  
  // Detect scientific content
  const scienceMatches = scienceKeywords.filter(keyword => 
    normalizedTopic.includes(keyword)
  );
  
  // Determine style based on content
  let suggestedStyle: 'mathematical' | 'scientific' | 'general' = 'general';
  let category = 'General';
  
  if (mathMatches.length > 0) {
    suggestedStyle = 'mathematical';
    category = 'Mathematics';
    keywords.push(...mathMatches);
  } else if (scienceMatches.length > 0) {
    suggestedStyle = 'scientific';
    category = 'Science';
    keywords.push(...scienceMatches);
  }
  
  // Determine complexity
  let detectedComplexity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  
  const hasAdvancedIndicators = advancedIndicators.some(indicator => 
    normalizedTopic.includes(indicator)
  );
  const hasBeginnerIndicators = beginnerIndicators.some(indicator => 
    normalizedTopic.includes(indicator)
  );
  
  if (hasAdvancedIndicators) {
    detectedComplexity = 'advanced';
  } else if (hasBeginnerIndicators) {
    detectedComplexity = 'beginner';
  }
  
  // Estimate duration based on complexity and topic length
  let estimatedDuration = 60; // Default 60 seconds
  
  if (detectedComplexity === 'beginner') {
    estimatedDuration = Math.max(30, Math.min(60, topic.length * 2));
  } else if (detectedComplexity === 'advanced') {
    estimatedDuration = Math.max(90, Math.min(180, topic.length * 3));
  } else {
    estimatedDuration = Math.max(45, Math.min(120, topic.length * 2.5));
  }
  
  // Calculate confidence based on keyword matches and indicators
  const totalMatches = mathMatches.length + scienceMatches.length;
  const indicatorMatches = (hasAdvancedIndicators ? 1 : 0) + (hasBeginnerIndicators ? 1 : 0);
  const confidence = Math.min(0.9, 0.4 + (totalMatches * 0.2) + (indicatorMatches * 0.2));
  
  return {
    topic,
    detectedComplexity,
    suggestedStyle,
    estimatedDuration,
    keywords,
    category,
    confidence
  };
}

/**
 * Generates a comprehensive prompt for Manim script generation based on the topic and options.
 * This is the main function requested in subtask 3.3.
 */
export function generatePrompt(topic: string, options: PromptOptions = {}): string {
  // Analyze the topic first
  const analysis = analyzeTopic(topic);
  
  // Use provided options or fall back to analysis suggestions
  const complexity = options.complexity || analysis.detectedComplexity;
  const style = options.style || analysis.suggestedStyle;
  const duration = options.duration || analysis.estimatedDuration;
  const includeExamples = options.includeExamples ?? true;
  const emphasizeVisuals = options.emphasizeVisuals ?? true;
  
  // Build complexity-specific instructions
  const complexityInstructions = {
    beginner: 'Use simple concepts and basic animations. Focus on clear, easy-to-understand explanations with minimal technical jargon.',
    intermediate: 'Include moderate complexity with balanced explanations and engaging animations. Use appropriate technical terms with explanations.',
    advanced: 'Use sophisticated concepts with detailed explanations and complex animations. Include technical depth and comprehensive coverage.'
  };
  
  // Build style-specific instructions
  const styleInstructions = {
    mathematical: 'Focus on mathematical equations, formulas, and mathematical visualizations using MathTex. Include step-by-step mathematical derivations.',
    scientific: 'Emphasize scientific diagrams, charts, and scientific concepts with appropriate visualizations. Include real-world applications.',
    general: 'Use a versatile approach with text, shapes, and general animations suitable for any topic. Focus on clear communication.'
  };
  
  // Build the comprehensive prompt
  let prompt = `You are an expert Manim script generator specializing in educational content. Create a complete, executable Manim script that explains: "${topic}"

## ANALYSIS CONTEXT:
- Detected Category: ${analysis.category}
- Confidence Level: ${(analysis.confidence * 100).toFixed(0)}%
- Key Concepts: ${analysis.keywords.join(', ') || 'General concepts'}

## REQUIREMENTS:

### 1. Complexity Level: ${complexity.toUpperCase()}
${complexityInstructions[complexity]}

### 2. Content Style: ${style.toUpperCase()}
${styleInstructions[style]}

### 3. Duration Target: ${duration} seconds
Structure the content to fit approximately ${duration} seconds of animation with appropriate pacing.

### 4. Technical Requirements:
- Use only standard Manim Community Edition imports and functions
- Create a single Scene class called "MainScene"
- Include proper timing with self.wait() calls for natural pacing
- Use appropriate animations (Write, Create, Transform, FadeIn, FadeOut, etc.)
- Ensure the script is syntactically correct and executable
- Include detailed comments explaining each section
- Make the content educational and engaging

### 5. Structure Requirements:
- Start with "from manim import *"
- Define MainScene(Scene) class
- Implement construct(self) method
- Include a compelling title sequence
- Present main content with clear visual progression
- End with a satisfying conclusion
- Use appropriate colors, positioning, and visual hierarchy`;

  if (includeExamples && analysis.keywords.length > 0) {
    prompt += `

### 6. Content Guidelines:
- Include concrete examples related to: ${analysis.keywords.slice(0, 3).join(', ')}
- Use real-world applications where appropriate
- Build concepts progressively from simple to complex`;
  }

  if (emphasizeVisuals) {
    prompt += `

### 7. Visual Emphasis:
- Prioritize visual explanations over text-heavy content
- Use animations to demonstrate concepts dynamically
- Include interactive elements where possible
- Ensure visual clarity and aesthetic appeal`;
  }

  prompt += `

### 8. Educational Quality:
- Ensure content accuracy and pedagogical soundness
- Use clear, engaging explanations appropriate for the target audience
- Include smooth transitions between concepts
- End with key takeaways or summary

Return ONLY the Python code, no explanations or markdown formatting. The script should be immediately executable with Manim Community Edition.`;

  return prompt;
}

/**
 * Generates a user prompt that complements the system prompt
 */
export function generateUserPrompt(topic: string, additionalContext?: string): string {
  let userPrompt = `Generate a Manim script that explains: "${topic}"`;
  
  if (additionalContext) {
    userPrompt += `\n\nAdditional context: ${additionalContext}`;
  }
  
  userPrompt += `

The script should be:
- Educational and visually engaging
- Appropriate for the specified complexity level and style
- Accurate and pedagogically sound
- Complete and immediately executable

Focus on creating a compelling visual narrative that effectively teaches the concept.`;

  return userPrompt;
}

/**
 * Validates that a topic is suitable for Manim script generation
 */
export function validateTopic(topic: string): { isValid: boolean; reason?: string } {
  if (!topic || topic.trim().length === 0) {
    return { isValid: false, reason: 'Topic cannot be empty' };
  }
  
  if (topic.trim().length < 3) {
    return { isValid: false, reason: 'Topic must be at least 3 characters long' };
  }
  
  if (topic.trim().length > 200) {
    return { isValid: false, reason: 'Topic must be less than 200 characters' };
  }
  
  // Check for inappropriate content (basic filter)
  const inappropriatePatterns = [
    /\b(violence|harmful|illegal|inappropriate)\b/i
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(topic)) {
      return { isValid: false, reason: 'Topic contains inappropriate content' };
    }
  }
  
  return { isValid: true };
}

/**
 * Suggests improvements for a topic to get better script generation results
 */
export function suggestTopicImprovements(topic: string): string[] {
  const suggestions: string[] = [];
  const analysis = analyzeTopic(topic);
  
  if (analysis.confidence < 0.5) {
    suggestions.push('Consider being more specific about the subject area (math, science, etc.)');
  }
  
  if (topic.length < 10) {
    suggestions.push('Add more detail to help generate a comprehensive script');
  }
  
  if (!topic.includes('explain') && !topic.includes('show') && !topic.includes('demonstrate')) {
    suggestions.push('Consider adding action words like "explain", "show", or "demonstrate"');
  }
  
  if (analysis.keywords.length === 0) {
    suggestions.push('Include specific concepts or terms you want covered');
  }
  
  return suggestions;
} 