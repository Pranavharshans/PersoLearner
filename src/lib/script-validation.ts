/**
 * Manim Script Validation Module
 * 
 * This module provides comprehensive validation for generated Manim scripts
 * to ensure they are syntactically correct and follow best practices.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 quality score
  suggestions: string[];
}

export interface ValidationError {
  type: 'syntax' | 'import' | 'class' | 'method' | 'structure';
  message: string;
  line?: number;
  severity: 'critical' | 'high' | 'medium';
}

export interface ValidationWarning {
  type: 'performance' | 'style' | 'best-practice' | 'compatibility';
  message: string;
  line?: number;
}

/**
 * Validates a generated Manim script for syntax, structure, and best practices
 */
export function validateManimScript(script: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];
  
  // Basic validation checks
  if (!script || script.trim().length === 0) {
    errors.push({
      type: 'structure',
      message: 'Script is empty or contains only whitespace',
      severity: 'critical'
    });
    return {
      isValid: false,
      errors,
      warnings,
      score: 0,
      suggestions: ['Generate a new script with valid content']
    };
  }

  const lines = script.split('\n');
  let score = 100;

  // 1. Check for required imports
  const hasManImport = script.includes('from manim import *') || script.includes('import manim');
  if (!hasManImport) {
    errors.push({
      type: 'import',
      message: 'Missing required Manim import statement',
      severity: 'critical'
    });
    score -= 30;
  }

  // 2. Check for MainScene class
  const hasMainSceneClass = /class\s+MainScene\s*\(\s*Scene\s*\)/.test(script);
  if (!hasMainSceneClass) {
    errors.push({
      type: 'class',
      message: 'Missing MainScene class that inherits from Scene',
      severity: 'critical'
    });
    score -= 25;
  }

  // 3. Check for construct method
  const hasConstructMethod = /def\s+construct\s*\(\s*self\s*\)/.test(script);
  if (!hasConstructMethod) {
    errors.push({
      type: 'method',
      message: 'Missing construct(self) method in MainScene class',
      severity: 'critical'
    });
    score -= 25;
  }

  // 4. Check for basic syntax issues
  const syntaxIssues = checkBasicSyntax(script, lines);
  errors.push(...syntaxIssues.errors);
  warnings.push(...syntaxIssues.warnings);
  score -= syntaxIssues.errors.length * 5;

  // 5. Check for Manim-specific best practices
  const bestPractices = checkManimBestPractices(script, lines);
  warnings.push(...bestPractices.warnings);
  suggestions.push(...bestPractices.suggestions);
  score -= bestPractices.warnings.length * 2;

  // 6. Check for performance considerations
  const performance = checkPerformanceIssues(script, lines);
  warnings.push(...performance.warnings);
  suggestions.push(...performance.suggestions);
  score -= performance.warnings.length * 1;

  // 7. Check for educational quality
  const educational = checkEducationalQuality(script, lines);
  warnings.push(...educational.warnings);
  suggestions.push(...educational.suggestions);

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Determine if script is valid (no critical errors)
  const isValid = !errors.some(error => error.severity === 'critical');

  return {
    isValid,
    errors,
    warnings,
    score,
    suggestions
  };
}

/**
 * Checks for basic Python syntax issues
 */
function checkBasicSyntax(script: string, lines: string[]): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // Check for common syntax errors
    if (trimmedLine.includes('self.play(') && !trimmedLine.includes(')')) {
      // Check if the play call is properly closed (basic check)
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        warnings.push({
          type: 'style',
          message: 'Potentially unclosed parentheses in play() call',
          line: lineNum
        });
      }
    }

    // Check for proper indentation in class/method definitions
    if (trimmedLine.startsWith('def ') && !line.startsWith('    ')) {
      if (lineNum > 1) { // Not the first line
        errors.push({
          type: 'syntax',
          message: 'Method definition should be indented within class',
          line: lineNum,
          severity: 'high'
        });
      }
    }

    // Check for missing colons
    if ((trimmedLine.startsWith('def ') || trimmedLine.startsWith('class ')) && !trimmedLine.endsWith(':')) {
      errors.push({
        type: 'syntax',
        message: 'Missing colon at end of function/class definition',
        line: lineNum,
        severity: 'high'
      });
    }
  });

  return { errors, warnings };
}

/**
 * Checks for Manim-specific best practices
 */
function checkManimBestPractices(script: string, lines: string[]): {
  warnings: ValidationWarning[];
  suggestions: string[];
} {
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check for self.wait() calls
  const hasWaitCalls = script.includes('self.wait(');
  if (!hasWaitCalls) {
    warnings.push({
      type: 'best-practice',
      message: 'No self.wait() calls found - animations may run too quickly'
    });
    suggestions.push('Add self.wait() calls between animations for better pacing');
  }

  // Check for animation variety
  const animationTypes = [
    'Write', 'Create', 'FadeIn', 'FadeOut', 'Transform', 'ReplacementTransform',
    'ShowCreation', 'DrawBorderThenFill', 'GrowFromCenter'
  ];
  
  const usedAnimations = animationTypes.filter(anim => script.includes(anim));
  if (usedAnimations.length < 2) {
    warnings.push({
      type: 'best-practice',
      message: 'Limited animation variety - consider using more animation types'
    });
    suggestions.push('Use a variety of animations (Write, Create, FadeIn, Transform, etc.) for engaging content');
  }

  // Check for comments
  const commentLines = lines.filter(line => line.trim().startsWith('#')).length;
  const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('#')).length;
  const commentRatio = commentLines / Math.max(codeLines, 1);
  
  if (commentRatio < 0.1) {
    warnings.push({
      type: 'best-practice',
      message: 'Insufficient comments - code should be well-documented'
    });
    suggestions.push('Add more comments to explain the purpose of each section');
  }

  // Check for proper scene structure
  const hasTitle = script.toLowerCase().includes('title') || script.includes('Text(');
  if (!hasTitle) {
    warnings.push({
      type: 'best-practice',
      message: 'No title or text elements found - consider adding explanatory text'
    });
    suggestions.push('Include a title and explanatory text for better educational value');
  }

  return { warnings, suggestions };
}

/**
 * Checks for potential performance issues
 */
function checkPerformanceIssues(script: string, lines: string[]): {
  warnings: ValidationWarning[];
  suggestions: string[];
} {
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check for excessive simultaneous animations
  lines.forEach((line, index) => {
    if (line.includes('self.play(') && line.includes(',')) {
      const commaCount = (line.match(/,/g) || []).length;
      if (commaCount > 5) {
        warnings.push({
          type: 'performance',
          message: 'Too many simultaneous animations may impact performance',
          line: index + 1
        });
      }
    }
  });

  // Check for very long wait times
  const waitMatches = script.match(/self\.wait\((\d+(?:\.\d+)?)\)/g);
  if (waitMatches) {
    waitMatches.forEach(match => {
      const waitTime = parseFloat(match.match(/\d+(?:\.\d+)?/)?.[0] || '0');
      if (waitTime > 5) {
        warnings.push({
          type: 'performance',
          message: `Long wait time (${waitTime}s) may make video feel slow`
        });
      }
    });
  }

  // Check for potential memory issues with complex objects
  const complexObjects = ['VGroup', 'NumberPlane', 'ComplexPlane'];
  complexObjects.forEach(obj => {
    const count = (script.match(new RegExp(obj, 'g')) || []).length;
    if (count > 3) {
      warnings.push({
        type: 'performance',
        message: `Multiple ${obj} objects may impact performance`
      });
      suggestions.push(`Consider reusing ${obj} objects or simplifying the scene`);
    }
  });

  return { warnings, suggestions };
}

/**
 * Checks for educational quality indicators
 */
function checkEducationalQuality(script: string, lines: string[]): {
  warnings: ValidationWarning[];
  suggestions: string[];
} {
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Check for mathematical content when appropriate
  const hasMathTex = script.includes('MathTex') || script.includes('Tex');
  const hasEquations = /[=+\-*/^]/.test(script);
  
  if (hasEquations && !hasMathTex) {
    suggestions.push('Consider using MathTex for mathematical expressions');
  }

  // Check for progressive complexity
  const hasMultipleScenes = script.split('self.play(').length > 3;
  if (!hasMultipleScenes) {
    warnings.push({
      type: 'best-practice',
      message: 'Simple scene structure - consider adding more progressive steps'
    });
    suggestions.push('Break down complex concepts into multiple animated steps');
  }

  // Check for conclusion or summary
  const hasConclusion = script.toLowerCase().includes('conclusion') || 
                       script.toLowerCase().includes('summary') ||
                       script.toLowerCase().includes('takeaway');
  
  if (!hasConclusion) {
    suggestions.push('Consider adding a conclusion or summary section');
  }

  return { warnings, suggestions };
}

/**
 * Attempts to fix common issues in Manim scripts
 */
export function autoFixScript(script: string): { fixedScript: string; changes: string[] } {
  let fixedScript = script;
  const changes: string[] = [];

  // Fix missing import
  if (!fixedScript.includes('from manim import *') && !fixedScript.includes('import manim')) {
    fixedScript = 'from manim import *\n\n' + fixedScript;
    changes.push('Added missing Manim import statement');
  }

  // Fix missing MainScene class structure
  if (!fixedScript.includes('class MainScene(Scene):')) {
    if (fixedScript.includes('class MainScene')) {
      fixedScript = fixedScript.replace(/class MainScene[^:]*/, 'class MainScene(Scene)');
      changes.push('Fixed MainScene class inheritance');
    }
  }

  // Fix missing construct method
  if (!fixedScript.includes('def construct(self):')) {
    if (fixedScript.includes('def construct')) {
      fixedScript = fixedScript.replace(/def construct[^:]*/, 'def construct(self)');
      changes.push('Fixed construct method signature');
    }
  }

  // Add basic wait calls if missing
  if (!fixedScript.includes('self.wait(') && fixedScript.includes('self.play(')) {
    fixedScript = fixedScript.replace(/self\.play\([^)]+\)/g, match => match + '\n        self.wait(1)');
    changes.push('Added basic wait calls after animations');
  }

  return { fixedScript, changes };
}

/**
 * Validates that a script contains valid Python syntax (basic check)
 */
export function validatePythonSyntax(script: string): { isValid: boolean; error?: string } {
  try {
    // Basic syntax validation checks
    const lines = script.split('\n');
    let indentLevel = 0;
    let inClass = false;
    let inMethod = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Check for basic Python syntax rules
      if (trimmed.startsWith('class ')) {
        if (!trimmed.endsWith(':')) {
          return { isValid: false, error: `Line ${i + 1}: Class definition missing colon` };
        }
        inClass = true;
      }

      if (trimmed.startsWith('def ')) {
        if (!trimmed.endsWith(':')) {
          return { isValid: false, error: `Line ${i + 1}: Function definition missing colon` };
        }
        inMethod = true;
      }

      // Check for proper indentation (basic)
      const currentIndent = line.length - line.trimStart().length;
      if (inClass && trimmed.startsWith('def ') && currentIndent === 0) {
        return { isValid: false, error: `Line ${i + 1}: Method should be indented within class` };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Syntax validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
} 