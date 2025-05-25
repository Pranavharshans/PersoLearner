/**
 * Unit tests for Model Management Module
 */

import {
  ModelRecommendationEngine,
  ModelConfigurationManager,
  ModelPerformanceTracker,
  AVAILABLE_MODELS,
  getModelById,
  getFreeModels,
  getModelsByProvider,
  calculateEstimatedCost,
  formatModelCapabilities
} from '../model-management';

describe('Model Management Module', () => {
  describe('AVAILABLE_MODELS', () => {
    test('should contain valid model definitions', () => {
      expect(Object.keys(AVAILABLE_MODELS).length).toBeGreaterThan(0);
      
      Object.values(AVAILABLE_MODELS).forEach(model => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.description).toBeDefined();
        expect(model.contextLength).toBeGreaterThan(0);
        expect(model.pricing).toBeDefined();
        expect(model.capabilities).toBeDefined();
        expect(model.recommended).toBeDefined();
        expect(typeof model.free).toBe('boolean');
        expect(typeof model.available).toBe('boolean');
      });
    });

    test('should have at least one free model', () => {
      const freeModels = Object.values(AVAILABLE_MODELS).filter(model => model.free);
      expect(freeModels.length).toBeGreaterThan(0);
    });

    test('should have models for all complexity levels', () => {
      const complexityLevels = ['beginner', 'intermediate', 'advanced'];
      
      complexityLevels.forEach(complexity => {
        const modelsForComplexity = Object.values(AVAILABLE_MODELS).filter(
          model => model.recommended.complexity.includes(complexity as any)
        );
        expect(modelsForComplexity.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ModelRecommendationEngine', () => {
    test('should recommend models based on complexity and style', () => {
      const recommendations = ModelRecommendationEngine.recommendModel(
        'advanced',
        'mathematical',
        'free',
        'accuracy'
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      // All recommended models should be free
      recommendations.forEach(model => {
        expect(model.free).toBe(true);
      });
    });

    test('should filter by budget correctly', () => {
      const freeRecommendations = ModelRecommendationEngine.recommendModel(
        'intermediate',
        'general',
        'free'
      );

      const highBudgetRecommendations = ModelRecommendationEngine.recommendModel(
        'intermediate',
        'general',
        'high'
      );

      // Free recommendations should only include free models
      freeRecommendations.forEach(model => {
        expect(model.free).toBe(true);
      });

      // High budget should include more models
      expect(highBudgetRecommendations.length).toBeGreaterThanOrEqual(freeRecommendations.length);
    });

    test('should prioritize models based on priority parameter', () => {
      const speedRecommendations = ModelRecommendationEngine.recommendModel(
        'intermediate',
        'general',
        'medium',
        'speed'
      );

      const accuracyRecommendations = ModelRecommendationEngine.recommendModel(
        'intermediate',
        'general',
        'medium',
        'accuracy'
      );

      expect(speedRecommendations).toBeDefined();
      expect(accuracyRecommendations).toBeDefined();
      
      // Results might be different based on priority
      // At minimum, they should be valid recommendations
      expect(speedRecommendations.length).toBeGreaterThan(0);
      expect(accuracyRecommendations.length).toBeGreaterThan(0);
    });

    test('should get optimal configuration for a model', () => {
      const modelId = 'deepseek/deepseek-chat-v3-0324:free';
      const config = ModelRecommendationEngine.getOptimalConfiguration(
        modelId,
        'advanced',
        'mathematical'
      );

      expect(config).toBeDefined();
      expect(config.selectedModel).toBe(modelId);
      expect(config.temperature).toBeDefined();
      expect(config.maxTokens).toBeDefined();
      expect(config.temperature).toBeGreaterThanOrEqual(0);
      expect(config.temperature).toBeLessThanOrEqual(1);
    });

    test('should return empty config for invalid model', () => {
      const config = ModelRecommendationEngine.getOptimalConfiguration(
        'invalid-model-id',
        'intermediate',
        'general'
      );

      expect(config).toEqual({});
    });
  });

  describe('ModelConfigurationManager', () => {
    let configManager: ModelConfigurationManager;

    beforeEach(() => {
      configManager = ModelConfigurationManager.getInstance();
      configManager.resetToDefaults();
    });

    test('should be a singleton', () => {
      const instance1 = ModelConfigurationManager.getInstance();
      const instance2 = ModelConfigurationManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should have default configuration', () => {
      const config = configManager.getCurrentConfiguration();
      
      expect(config).toBeDefined();
      expect(config.selectedModel).toBeDefined();
      expect(config.temperature).toBeDefined();
      expect(config.maxTokens).toBeDefined();
      expect(typeof config.temperature).toBe('number');
      expect(typeof config.maxTokens).toBe('number');
    });

    test('should update configuration', () => {
      const updates = {
        temperature: 0.5,
        maxTokens: 2000
      };

      configManager.updateConfiguration(updates);
      const config = configManager.getCurrentConfiguration();

      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(2000);
    });

    test('should set model and apply optimal configuration', () => {
      const modelId = 'anthropic/claude-3.5-sonnet';
      
      configManager.setModel(modelId);
      const config = configManager.getCurrentConfiguration();

      expect(config.selectedModel).toBe(modelId);
    });

    test('should throw error for invalid model', () => {
      expect(() => {
        configManager.setModel('invalid-model-id');
      }).toThrow();
    });

    test('should set fallback model', () => {
      const fallbackModelId = 'meta-llama/llama-3.1-70b-instruct:free';
      
      configManager.setFallbackModel(fallbackModelId);
      const config = configManager.getCurrentConfiguration();

      expect(config.fallbackModel).toBe(fallbackModelId);
    });

    test('should get recommended models', () => {
      const recommendations = configManager.getRecommendedModels(
        'intermediate',
        'scientific',
        'free'
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should reset to defaults', () => {
      // Modify configuration
      configManager.updateConfiguration({ temperature: 0.9, maxTokens: 1000 });
      
      // Reset
      configManager.resetToDefaults();
      const config = configManager.getCurrentConfiguration();

      // Should be back to defaults
      expect(config.temperature).not.toBe(0.9);
      expect(config.maxTokens).not.toBe(1000);
    });
  });

  describe('ModelPerformanceTracker', () => {
    let performanceTracker: ModelPerformanceTracker;

    beforeEach(() => {
      performanceTracker = ModelPerformanceTracker.getInstance();
      // Clear any existing data
      performanceTracker.getAllPerformanceData().forEach(perf => {
        // Reset internal state if needed
      });
    });

    test('should be a singleton', () => {
      const instance1 = ModelPerformanceTracker.getInstance();
      const instance2 = ModelPerformanceTracker.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should record generation metrics', () => {
      const modelId = 'deepseek/deepseek-chat-v3-0324:free';
      const metrics = {
        responseTime: 5000,
        tokenCount: 1000,
        validationScore: 85,
        userRating: 4,
        complexity: 'intermediate',
        style: 'mathematical'
      };

      performanceTracker.recordGeneration(modelId, metrics);
      const performance = performanceTracker.getModelPerformance(modelId);

      expect(performance).toBeDefined();
      expect(performance!.modelId).toBe(modelId);
      expect(performance!.totalGenerations).toBe(1);
      expect(performance!.averageResponseTime).toBe(5000);
      expect(performance!.averageValidationScore).toBe(85);
      expect(performance!.averageUserRating).toBe(4);
    });

    test('should calculate averages correctly', () => {
      const modelId = 'test-model';
      
      // Record multiple generations
      performanceTracker.recordGeneration(modelId, {
        responseTime: 4000,
        tokenCount: 800,
        validationScore: 80,
        complexity: 'intermediate',
        style: 'general'
      });

      performanceTracker.recordGeneration(modelId, {
        responseTime: 6000,
        tokenCount: 1200,
        validationScore: 90,
        complexity: 'intermediate',
        style: 'general'
      });

      const performance = performanceTracker.getModelPerformance(modelId);

      expect(performance!.totalGenerations).toBe(2);
      expect(performance!.averageResponseTime).toBe(5000); // (4000 + 6000) / 2
      expect(performance!.averageValidationScore).toBe(85); // (80 + 90) / 2
    });

    test('should track performance by complexity and style', () => {
      const modelId = 'test-model';
      
      performanceTracker.recordGeneration(modelId, {
        responseTime: 5000,
        tokenCount: 1000,
        validationScore: 85,
        complexity: 'advanced',
        style: 'mathematical'
      });

      const performance = performanceTracker.getModelPerformance(modelId);

      expect(performance!.complexityPerformance['advanced']).toBe(85);
      expect(performance!.stylePerformance['mathematical']).toBe(85);
    });

    test('should get all performance data', () => {
      const modelId1 = 'model-1';
      const modelId2 = 'model-2';

      performanceTracker.recordGeneration(modelId1, {
        responseTime: 5000,
        tokenCount: 1000,
        validationScore: 85,
        complexity: 'intermediate',
        style: 'general'
      });

      performanceTracker.recordGeneration(modelId2, {
        responseTime: 3000,
        tokenCount: 800,
        validationScore: 90,
        complexity: 'intermediate',
        style: 'general'
      });

      const allPerformance = performanceTracker.getAllPerformanceData();
      expect(allPerformance.length).toBeGreaterThanOrEqual(2);
    });

    test('should return null for non-existent model performance', () => {
      const performance = performanceTracker.getModelPerformance('non-existent-model');
      expect(performance).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    test('getModelById should return correct model', () => {
      const modelId = 'deepseek/deepseek-chat-v3-0324:free';
      const model = getModelById(modelId);

      expect(model).toBeDefined();
      expect(model!.id).toBe(modelId);
    });

    test('getModelById should return null for invalid id', () => {
      const model = getModelById('invalid-model-id');
      expect(model).toBeNull();
    });

    test('getFreeModels should return only free models', () => {
      const freeModels = getFreeModels();

      expect(Array.isArray(freeModels)).toBe(true);
      expect(freeModels.length).toBeGreaterThan(0);
      
      freeModels.forEach(model => {
        expect(model.free).toBe(true);
        expect(model.available).toBe(true);
      });
    });

    test('getModelsByProvider should filter by provider', () => {
      const deepSeekModels = getModelsByProvider('DeepSeek');
      
      expect(Array.isArray(deepSeekModels)).toBe(true);
      
      deepSeekModels.forEach(model => {
        expect(model.provider).toBe('DeepSeek');
        expect(model.available).toBe(true);
      });
    });

    test('calculateEstimatedCost should calculate correctly', () => {
      const modelId = 'anthropic/claude-3.5-sonnet';
      const promptTokens = 1000;
      const completionTokens = 500;

      const cost = calculateEstimatedCost(modelId, promptTokens, completionTokens);

      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThan(0);
    });

    test('calculateEstimatedCost should return 0 for free models', () => {
      const modelId = 'deepseek/deepseek-chat-v3-0324:free';
      const cost = calculateEstimatedCost(modelId, 1000, 500);

      expect(cost).toBe(0);
    });

    test('calculateEstimatedCost should return 0 for invalid model', () => {
      const cost = calculateEstimatedCost('invalid-model', 1000, 500);
      expect(cost).toBe(0);
    });

    test('formatModelCapabilities should format capabilities correctly', () => {
      const model = AVAILABLE_MODELS['deepseek/deepseek-chat-v3-0324:free'];
      const formatted = formatModelCapabilities(model);

      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('formatModelCapabilities should handle models with no strong capabilities', () => {
      const mockModel = {
        id: 'test',
        name: 'Test Model',
        provider: 'Test',
        description: 'Test',
        contextLength: 1000,
        pricing: { prompt: 0, completion: 0 },
        capabilities: {
          reasoning: 5,
          creativity: 6,
          speed: 7,
          accuracy: 5
        },
        recommended: {
          complexity: ['beginner'] as const,
          style: ['general'] as const,
          useCase: ['test']
        },
        free: true,
        available: true
      };

      const formatted = formatModelCapabilities(mockModel);
      expect(formatted).toBe('Balanced performance');
    });
  });
}); 