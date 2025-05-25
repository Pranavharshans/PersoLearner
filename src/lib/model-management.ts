/**
 * Model Management Module for OpenRouter Integration
 * 
 * This module provides comprehensive model selection, configuration,
 * and management capabilities for the Manim script generation system.
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  pricing: {
    prompt: number; // per 1M tokens
    completion: number; // per 1M tokens
  };
  capabilities: {
    reasoning: number; // 1-10 scale
    creativity: number; // 1-10 scale
    speed: number; // 1-10 scale
    accuracy: number; // 1-10 scale
  };
  recommended: {
    complexity: ('beginner' | 'intermediate' | 'advanced')[];
    style: ('mathematical' | 'scientific' | 'general')[];
    useCase: string[];
  };
  free: boolean;
  available: boolean;
}

export interface ModelConfiguration {
  selectedModel: string;
  fallbackModel?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  customProvider?: string;
}

/**
 * Available OpenRouter models with their specifications
 */
export const AVAILABLE_MODELS: Record<string, ModelInfo> = {
  'deepseek/deepseek-chat-v3-0324:free': {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek Chat V3 (Free)',
    provider: 'DeepSeek',
    description: 'Advanced reasoning model with strong mathematical and scientific capabilities',
    contextLength: 32000,
    pricing: { prompt: 0, completion: 0 },
    capabilities: {
      reasoning: 9,
      creativity: 7,
      speed: 8,
      accuracy: 9
    },
    recommended: {
      complexity: ['intermediate', 'advanced'],
      style: ['mathematical', 'scientific'],
      useCase: ['mathematical proofs', 'scientific explanations', 'complex reasoning']
    },
    free: true,
    available: true
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Excellent for educational content with strong reasoning and explanation abilities',
    contextLength: 200000,
    pricing: { prompt: 3, completion: 15 },
    capabilities: {
      reasoning: 10,
      creativity: 9,
      speed: 7,
      accuracy: 10
    },
    recommended: {
      complexity: ['beginner', 'intermediate', 'advanced'],
      style: ['mathematical', 'scientific', 'general'],
      useCase: ['educational content', 'detailed explanations', 'step-by-step tutorials']
    },
    free: false,
    available: true
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Versatile model with strong performance across all content types',
    contextLength: 128000,
    pricing: { prompt: 5, completion: 15 },
    capabilities: {
      reasoning: 9,
      creativity: 9,
      speed: 8,
      accuracy: 9
    },
    recommended: {
      complexity: ['beginner', 'intermediate', 'advanced'],
      style: ['mathematical', 'scientific', 'general'],
      useCase: ['general education', 'creative explanations', 'versatile content']
    },
    free: false,
    available: true
  },
  'google/gemini-pro-1.5': {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    description: 'Strong analytical capabilities with excellent scientific reasoning',
    contextLength: 1000000,
    pricing: { prompt: 3.5, completion: 10.5 },
    capabilities: {
      reasoning: 9,
      creativity: 8,
      speed: 9,
      accuracy: 9
    },
    recommended: {
      complexity: ['intermediate', 'advanced'],
      style: ['scientific', 'mathematical'],
      useCase: ['scientific analysis', 'data visualization', 'research content']
    },
    free: false,
    available: true
  },
  'meta-llama/llama-3.1-70b-instruct:free': {
    id: 'meta-llama/llama-3.1-70b-instruct:free',
    name: 'Llama 3.1 70B (Free)',
    provider: 'Meta',
    description: 'Open-source model with good general capabilities',
    contextLength: 131072,
    pricing: { prompt: 0, completion: 0 },
    capabilities: {
      reasoning: 7,
      creativity: 8,
      speed: 9,
      accuracy: 7
    },
    recommended: {
      complexity: ['beginner', 'intermediate'],
      style: ['general'],
      useCase: ['general education', 'simple explanations', 'basic content']
    },
    free: true,
    available: true
  },
  'mistralai/mistral-large': {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    description: 'Efficient model with strong reasoning capabilities',
    contextLength: 128000,
    pricing: { prompt: 4, completion: 12 },
    capabilities: {
      reasoning: 8,
      creativity: 7,
      speed: 9,
      accuracy: 8
    },
    recommended: {
      complexity: ['intermediate', 'advanced'],
      style: ['mathematical', 'scientific'],
      useCase: ['technical content', 'logical reasoning', 'structured explanations']
    },
    free: false,
    available: true
  }
};

/**
 * Model recommendation engine
 */
export class ModelRecommendationEngine {
  /**
   * Recommends the best model based on user requirements
   */
  static recommendModel(
    complexity: 'beginner' | 'intermediate' | 'advanced',
    style: 'mathematical' | 'scientific' | 'general',
    budget: 'free' | 'low' | 'medium' | 'high' = 'medium',
    priority: 'speed' | 'accuracy' | 'creativity' | 'reasoning' = 'accuracy'
  ): ModelInfo[] {
    const models = Object.values(AVAILABLE_MODELS).filter(model => model.available);
    
    // Filter by budget
    const budgetFiltered = models.filter(model => {
      if (budget === 'free') return model.free;
      if (budget === 'low') return model.free || (model.pricing.prompt + model.pricing.completion) < 10;
      if (budget === 'medium') return (model.pricing.prompt + model.pricing.completion) < 25;
      return true; // high budget - all models
    });

    // Score models based on requirements
    const scoredModels = budgetFiltered.map(model => {
      let score = 0;
      
      // Complexity match
      if (model.recommended.complexity.includes(complexity)) score += 30;
      
      // Style match
      if (model.recommended.style.includes(style)) score += 25;
      
      // Priority capability
      score += model.capabilities[priority] * 5;
      
      // Overall capability average
      const avgCapability = Object.values(model.capabilities).reduce((a, b) => a + b, 0) / 4;
      score += avgCapability * 2;
      
      // Free models get bonus for accessibility
      if (model.free) score += 10;
      
      return { model, score };
    });

    // Sort by score and return top recommendations
    return scoredModels
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.model);
  }

  /**
   * Gets the optimal configuration for a specific model
   */
  static getOptimalConfiguration(
    modelId: string,
    complexity: 'beginner' | 'intermediate' | 'advanced',
    style: 'mathematical' | 'scientific' | 'general'
  ): Partial<ModelConfiguration> {
    const model = AVAILABLE_MODELS[modelId];
    if (!model) return {};

    // Base configuration
    let config: Partial<ModelConfiguration> = {
      selectedModel: modelId,
      maxTokens: Math.min(4000, model.contextLength * 0.3), // Use 30% of context for output
    };

    // Adjust temperature based on style and complexity
    if (style === 'mathematical') {
      config.temperature = complexity === 'advanced' ? 0.3 : 0.2; // Lower for precision
    } else if (style === 'scientific') {
      config.temperature = complexity === 'advanced' ? 0.5 : 0.4; // Moderate for clarity
    } else {
      config.temperature = complexity === 'beginner' ? 0.6 : 0.7; // Higher for creativity
    }

    // Model-specific optimizations
    switch (model.provider) {
      case 'DeepSeek':
        config.topP = 0.8;
        config.frequencyPenalty = 0.1;
        break;
      case 'Anthropic':
        config.topP = 0.9;
        config.presencePenalty = 0.1;
        break;
      case 'OpenAI':
        config.topP = 0.85;
        config.frequencyPenalty = 0.2;
        break;
      case 'Google':
        config.topP = 0.95;
        break;
      case 'Meta':
        config.temperature = Math.min(config.temperature! + 0.1, 0.9); // Slightly higher for Llama
        break;
    }

    return config;
  }
}

/**
 * Model performance tracker
 */
export class ModelPerformanceTracker {
  private static instance: ModelPerformanceTracker;
  private performanceData: Map<string, ModelPerformance> = new Map();

  static getInstance(): ModelPerformanceTracker {
    if (!ModelPerformanceTracker.instance) {
      ModelPerformanceTracker.instance = new ModelPerformanceTracker();
    }
    return ModelPerformanceTracker.instance;
  }

  recordGeneration(
    modelId: string,
    metrics: {
      responseTime: number;
      tokenCount: number;
      validationScore: number;
      userRating?: number;
      complexity: string;
      style: string;
    }
  ): void {
    const existing = this.performanceData.get(modelId) || {
      modelId,
      totalGenerations: 0,
      averageResponseTime: 0,
      averageValidationScore: 0,
      averageUserRating: 0,
      totalTokens: 0,
      successRate: 0,
      complexityPerformance: {},
      stylePerformance: {}
    };

    // Update metrics
    existing.totalGenerations++;
    existing.averageResponseTime = this.updateAverage(
      existing.averageResponseTime,
      metrics.responseTime,
      existing.totalGenerations
    );
    existing.averageValidationScore = this.updateAverage(
      existing.averageValidationScore,
      metrics.validationScore,
      existing.totalGenerations
    );
    existing.totalTokens += metrics.tokenCount;

    if (metrics.userRating) {
      existing.averageUserRating = this.updateAverage(
        existing.averageUserRating,
        metrics.userRating,
        existing.totalGenerations
      );
    }

    // Track performance by complexity and style
    this.updatePerformanceByCategory(existing.complexityPerformance, metrics.complexity, metrics.validationScore);
    this.updatePerformanceByCategory(existing.stylePerformance, metrics.style, metrics.validationScore);

    this.performanceData.set(modelId, existing);
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  private updatePerformanceByCategory(
    categoryPerf: Record<string, number>,
    category: string,
    score: number
  ): void {
    if (!categoryPerf[category]) {
      categoryPerf[category] = score;
    } else {
      categoryPerf[category] = (categoryPerf[category] + score) / 2;
    }
  }

  getModelPerformance(modelId: string): ModelPerformance | null {
    return this.performanceData.get(modelId) || null;
  }

  getAllPerformanceData(): ModelPerformance[] {
    return Array.from(this.performanceData.values());
  }

  getBestPerformingModel(
    complexity?: string,
    style?: string
  ): string | null {
    const performances = this.getAllPerformanceData();
    if (performances.length === 0) return null;

    let bestModel = performances[0];
    let bestScore = this.calculateOverallScore(bestModel, complexity, style);

    for (const perf of performances.slice(1)) {
      const score = this.calculateOverallScore(perf, complexity, style);
      if (score > bestScore) {
        bestScore = score;
        bestModel = perf;
      }
    }

    return bestModel.modelId;
  }

  private calculateOverallScore(
    performance: ModelPerformance,
    complexity?: string,
    style?: string
  ): number {
    let score = performance.averageValidationScore * 0.4 + performance.averageUserRating * 0.3;
    
    // Add response time factor (faster is better)
    score += Math.max(0, (10000 - performance.averageResponseTime) / 10000) * 0.2;
    
    // Add category-specific performance
    if (complexity && performance.complexityPerformance[complexity]) {
      score += performance.complexityPerformance[complexity] * 0.05;
    }
    
    if (style && performance.stylePerformance[style]) {
      score += performance.stylePerformance[style] * 0.05;
    }

    return score;
  }
}

interface ModelPerformance {
  modelId: string;
  totalGenerations: number;
  averageResponseTime: number;
  averageValidationScore: number;
  averageUserRating: number;
  totalTokens: number;
  successRate: number;
  complexityPerformance: Record<string, number>;
  stylePerformance: Record<string, number>;
}

/**
 * Model configuration manager
 */
export class ModelConfigurationManager {
  private static instance: ModelConfigurationManager;
  private currentConfig: ModelConfiguration;

  private constructor() {
    this.currentConfig = this.getDefaultConfiguration();
  }

  static getInstance(): ModelConfigurationManager {
    if (!ModelConfigurationManager.instance) {
      ModelConfigurationManager.instance = new ModelConfigurationManager();
    }
    return ModelConfigurationManager.instance;
  }

  private getDefaultConfiguration(): ModelConfiguration {
    return {
      selectedModel: 'deepseek/deepseek-chat-v3-0324:free',
      fallbackModel: 'meta-llama/llama-3.1-70b-instruct:free',
      temperature: 0.7,
      maxTokens: 4000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    };
  }

  getCurrentConfiguration(): ModelConfiguration {
    return { ...this.currentConfig };
  }

  updateConfiguration(updates: Partial<ModelConfiguration>): void {
    this.currentConfig = { ...this.currentConfig, ...updates };
    this.saveConfiguration();
  }

  setModel(modelId: string): void {
    if (!AVAILABLE_MODELS[modelId]) {
      throw new Error(`Model ${modelId} is not available`);
    }
    
    this.currentConfig.selectedModel = modelId;
    
    // Apply optimal configuration for the selected model
    const optimalConfig = ModelRecommendationEngine.getOptimalConfiguration(
      modelId,
      'intermediate', // Default complexity
      'general' // Default style
    );
    
    Object.assign(this.currentConfig, optimalConfig);
    this.saveConfiguration();
  }

  setFallbackModel(modelId: string): void {
    if (!AVAILABLE_MODELS[modelId]) {
      throw new Error(`Fallback model ${modelId} is not available`);
    }
    
    this.currentConfig.fallbackModel = modelId;
    this.saveConfiguration();
  }

  getRecommendedModels(
    complexity: 'beginner' | 'intermediate' | 'advanced',
    style: 'mathematical' | 'scientific' | 'general',
    budget: 'free' | 'low' | 'medium' | 'high' = 'medium'
  ): ModelInfo[] {
    return ModelRecommendationEngine.recommendModel(complexity, style, budget);
  }

  private saveConfiguration(): void {
    // In a real application, you might save to localStorage or a backend
    if (typeof window !== 'undefined') {
      localStorage.setItem('manimNext_modelConfig', JSON.stringify(this.currentConfig));
    }
  }

  loadConfiguration(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manimNext_modelConfig');
      if (saved) {
        try {
          this.currentConfig = { ...this.getDefaultConfiguration(), ...JSON.parse(saved) };
        } catch (error) {
          console.warn('Failed to load saved model configuration:', error);
        }
      }
    }
  }

  resetToDefaults(): void {
    this.currentConfig = this.getDefaultConfiguration();
    this.saveConfiguration();
  }
}

/**
 * Utility functions for model management
 */
export function getModelById(modelId: string): ModelInfo | null {
  return AVAILABLE_MODELS[modelId] || null;
}

export function getFreeModels(): ModelInfo[] {
  return Object.values(AVAILABLE_MODELS).filter(model => model.free && model.available);
}

export function getModelsByProvider(provider: string): ModelInfo[] {
  return Object.values(AVAILABLE_MODELS).filter(
    model => model.provider === provider && model.available
  );
}

export function calculateEstimatedCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = AVAILABLE_MODELS[modelId];
  if (!model || model.free) return 0;
  
  const promptCost = (promptTokens / 1000000) * model.pricing.prompt;
  const completionCost = (completionTokens / 1000000) * model.pricing.completion;
  
  return promptCost + completionCost;
}

export function formatModelCapabilities(model: ModelInfo): string {
  const capabilities = model.capabilities;
  const strengths = Object.entries(capabilities)
    .filter(([_, score]) => score >= 8)
    .map(([capability, _]) => capability);
  
  if (strengths.length === 0) return 'Balanced performance';
  return `Strong in: ${strengths.join(', ')}`;
} 