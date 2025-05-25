'use client';

import React, { useState, useEffect } from 'react';
import { 
  ModelInfo, 
  ModelConfiguration,
  ModelConfigurationManager,
  ModelRecommendationEngine,
  ModelPerformanceTracker,
  AVAILABLE_MODELS,
  getFreeModels,
  getModelsByProvider,
  calculateEstimatedCost,
  formatModelCapabilities
} from '@/lib/model-management';

interface ModelSelectorProps {
  complexity: 'beginner' | 'intermediate' | 'advanced';
  style: 'mathematical' | 'scientific' | 'general';
  onModelChange?: (modelId: string) => void;
  showAdvanced?: boolean;
}

export default function ModelSelector({ 
  complexity, 
  style, 
  onModelChange,
  showAdvanced = false 
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [configuration, setConfiguration] = useState<ModelConfiguration | null>(null);
  const [recommendations, setRecommendations] = useState<ModelInfo[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [budget, setBudget] = useState<'free' | 'low' | 'medium' | 'high'>('free');
  const [priority, setPriority] = useState<'speed' | 'accuracy' | 'creativity' | 'reasoning'>('accuracy');
  const [showPerformance, setShowPerformance] = useState(false);

  const configManager = ModelConfigurationManager.getInstance();
  const performanceTracker = ModelPerformanceTracker.getInstance();

  useEffect(() => {
    // Load configuration and set initial state
    configManager.loadConfiguration();
    const config = configManager.getCurrentConfiguration();
    setConfiguration(config);
    setSelectedModel(config.selectedModel);

    // Get recommendations
    updateRecommendations();
  }, [complexity, style, budget, priority]);

  const updateRecommendations = () => {
    const recs = ModelRecommendationEngine.recommendModel(complexity, style, budget, priority);
    setRecommendations(recs);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    configManager.setModel(modelId);
    setConfiguration(configManager.getCurrentConfiguration());
    onModelChange?.(modelId);
  };

  const handleConfigurationChange = (updates: Partial<ModelConfiguration>) => {
    configManager.updateConfiguration(updates);
    setConfiguration(configManager.getCurrentConfiguration());
  };

  const getModelPerformance = (modelId: string) => {
    return performanceTracker.getModelPerformance(modelId);
  };

  const renderModelCard = (model: ModelInfo, isRecommended = false, rank?: number) => {
    const performance = getModelPerformance(model.id);
    const isSelected = selectedModel === model.id;
    
    return (
      <div
        key={model.id}
        className={`
          relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
          }
          ${isRecommended ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}
        `}
        onClick={() => handleModelSelect(model.id)}
      >
        {isRecommended && rank && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            #{rank}
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {model.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {model.provider}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {model.free && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Free
              </span>
            )}
            {isSelected && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Selected
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {model.description}
        </p>

        <div className="space-y-2">
          {/* Capabilities */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(model.capabilities).map(([capability, score]) => (
              <div key={capability} className="flex items-center space-x-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {capability}:
                </span>
                <div className="flex">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-3 mr-0.5 ${
                        i < score 
                          ? 'bg-blue-500' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {score}/10
                </span>
              </div>
            ))}
          </div>

          {/* Performance data */}
          {performance && (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div>Generations: {performance.totalGenerations}</div>
              <div>Avg Score: {performance.averageValidationScore.toFixed(1)}/100</div>
              <div>Avg Time: {(performance.averageResponseTime / 1000).toFixed(1)}s</div>
            </div>
          )}

          {/* Pricing */}
          {!model.free && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              ${model.pricing.prompt}/1M prompt + ${model.pricing.completion}/1M completion
            </div>
          )}

          {/* Recommended use cases */}
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatModelCapabilities(model)}
          </div>
        </div>
      </div>
    );
  };

  const renderAdvancedConfiguration = () => {
    if (!configuration || !showAdvanced) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Advanced Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temperature: {configuration.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={configuration.temperature}
              onChange={(e) => handleConfigurationChange({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Tokens: {configuration.maxTokens}
            </label>
            <input
              type="range"
              min="1000"
              max="8000"
              step="500"
              value={configuration.maxTokens}
              onChange={(e) => handleConfigurationChange({ maxTokens: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Top P */}
          {configuration.topP !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Top P: {configuration.topP}
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={configuration.topP}
                onChange={(e) => handleConfigurationChange({ topP: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          )}

          {/* Frequency Penalty */}
          {configuration.frequencyPenalty !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency Penalty: {configuration.frequencyPenalty}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={configuration.frequencyPenalty}
                onChange={(e) => handleConfigurationChange({ frequencyPenalty: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Fallback Model */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fallback Model
          </label>
          <select
            value={configuration.fallbackModel || ''}
            onChange={(e) => handleConfigurationChange({ fallbackModel: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">No fallback</option>
            {Object.values(AVAILABLE_MODELS)
              .filter(model => model.id !== selectedModel)
              .map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.free ? '(Free)' : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Reset to defaults */}
        <button
          onClick={() => {
            configManager.resetToDefaults();
            setConfiguration(configManager.getCurrentConfiguration());
          }}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Budget
          </label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as any)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="free">Free Only</option>
            <option value="low">Low Cost (&lt;$10/1M)</option>
            <option value="medium">Medium Cost (&lt;$25/1M)</option>
            <option value="high">Any Cost</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="accuracy">Accuracy</option>
            <option value="speed">Speed</option>
            <option value="creativity">Creativity</option>
            <option value="reasoning">Reasoning</option>
          </select>
        </div>

        <div className="flex items-end space-x-2">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showRecommendations
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Recommendations
          </button>
          
          <button
            onClick={() => setShowPerformance(!showPerformance)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showPerformance
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Performance
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Recommended Models for {complexity} {style} content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((model, index) => 
              renderModelCard(model, true, index + 1)
            )}
          </div>
        </div>
      )}

      {/* All Models */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          All Available Models
        </h2>
        
        {/* Free Models */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
            Free Models
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFreeModels().map(model => renderModelCard(model))}
          </div>
        </div>

        {/* Premium Models */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
            Premium Models
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(AVAILABLE_MODELS)
              .filter(model => !model.free && model.available)
              .map(model => renderModelCard(model))}
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      {renderAdvancedConfiguration()}

      {/* Toggle Advanced */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Configuration
        </button>
      </div>
    </div>
  );
} 