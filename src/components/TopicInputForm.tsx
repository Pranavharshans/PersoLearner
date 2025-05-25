'use client';

import { useState } from 'react';
import { Send, Sparkles, Clock, Settings, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface TopicInputFormProps {
  onClose: () => void;
}

interface GeneratedScript {
  script: string;
  sceneClass: string;
  estimatedDuration: number;
  complexity: string;
  narration?: string;
  metadata: {
    topic: string;
    style: string;
    model: string;
    generatedAt: string;
  };
}

export default function TopicInputForm({ onClose }: TopicInputFormProps) {
  const [formData, setFormData] = useState({
    topic: '',
    complexity: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    duration: 60,
    style: 'general' as 'mathematical' | 'scientific' | 'general',
    includeNarration: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    } else if (formData.topic.trim().length < 10) {
      newErrors.topic = 'Topic should be at least 10 characters long';
    }

    if (formData.duration < 30 || formData.duration > 300) {
      newErrors.duration = 'Duration should be between 30 and 300 seconds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Script generation failed');
      }

      setGeneratedScript(data.data);
    } catch (error) {
      console.error('Error generating script:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to generate script');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear API error when user makes changes
    if (apiError) {
      setApiError(null);
    }
  };

  const handleStartOver = () => {
    setGeneratedScript(null);
    setApiError(null);
    setFormData({
      topic: '',
      complexity: 'intermediate',
      duration: 60,
      style: 'general',
      includeNarration: false,
    });
  };

  // Show success screen if script was generated
  if (generatedScript) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Script Generated Successfully!</h2>
          <p className="text-sm sm:text-base text-gray-600">Your Manim script is ready for video rendering.</p>
        </div>

        {/* Script Preview */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Generated Script Preview:</h3>
          <div className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm max-h-32 sm:max-h-40 overflow-y-auto">
            <pre>{generatedScript.script.substring(0, 300)}...</pre>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-medium text-gray-700">Topic:</span>
            <p className="text-gray-600 break-words">{generatedScript.metadata.topic}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Complexity:</span>
            <p className="text-gray-600 capitalize">{generatedScript.complexity}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Style:</span>
            <p className="text-gray-600 capitalize">{generatedScript.metadata.style}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Duration:</span>
            <p className="text-gray-600">{generatedScript.estimatedDuration}s</p>
          </div>
        </div>

        {/* Narration Preview */}
        {generatedScript.narration && (
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Narration Script:</h3>
            <p className="text-gray-700 text-xs sm:text-sm break-words">{generatedScript.narration.substring(0, 200)}...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleStartOver}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation tap-highlight-transparent"
          >
            Create Another
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base touch-manipulation tap-highlight-transparent"
          >
            Continue to Rendering
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* API Error Display */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 text-sm sm:text-base">Generation Failed</h3>
            <p className="text-red-700 text-xs sm:text-sm mt-1">{apiError}</p>
          </div>
        </div>
      )}

      {/* Topic Input */}
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
          <BookOpen className="w-4 h-4 inline mr-2" />
          What topic would you like to create a video about?
        </label>
        <textarea
          id="topic"
          rows={4}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base ${
            errors.topic ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Explain the Pythagorean theorem with visual proofs and real-world applications"
          value={formData.topic}
          onChange={(e) => handleInputChange('topic', e.target.value)}
        />
        {errors.topic && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.topic}</p>
        )}
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Be specific about what you want to explain. The more detail you provide, the better the video will be.
        </p>
      </div>

      {/* Complexity Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Settings className="w-4 h-4 inline mr-2" />
          Complexity Level
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {[
            { value: 'beginner', label: 'Beginner', desc: 'Simple explanations' },
            { value: 'intermediate', label: 'Intermediate', desc: 'Balanced approach' },
            { value: 'advanced', label: 'Advanced', desc: 'Detailed analysis' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('complexity', option.value)}
              className={`p-2 sm:p-3 border rounded-lg text-center transition-all touch-manipulation tap-highlight-transparent ${
                formData.complexity === option.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm sm:text-base">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-2" />
          Target Duration (seconds)
        </label>
        <input
          type="number"
          id="duration"
          min="30"
          max="300"
          step="10"
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${
            errors.duration ? 'border-red-500' : 'border-gray-300'
          }`}
          value={formData.duration}
          onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
        />
        {errors.duration && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.duration}</p>
        )}
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Recommended: 60-120 seconds for most topics
        </p>
      </div>

      {/* Content Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Sparkles className="w-4 h-4 inline mr-2" />
          Content Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {[
            { value: 'mathematical', label: 'Mathematical', desc: 'Equations & proofs' },
            { value: 'scientific', label: 'Scientific', desc: 'Diagrams & concepts' },
            { value: 'general', label: 'General', desc: 'Versatile approach' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleInputChange('style', option.value)}
              className={`p-2 sm:p-3 border rounded-lg text-center transition-all touch-manipulation tap-highlight-transparent ${
                formData.style === option.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm sm:text-base">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Include Narration */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="narration"
          checked={formData.includeNarration}
          onChange={(e) => handleInputChange('includeNarration', e.target.checked)}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label htmlFor="narration" className="ml-2 text-sm text-gray-700">
          Include narration script for voiceover
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation tap-highlight-transparent"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation tap-highlight-transparent"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Generate Script
            </>
          )}
        </button>
      </div>

      {/* Estimated Cost */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>Estimated generation time:</span>
          <span className="font-medium">2-5 seconds</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span>Estimated cost:</span>
          <span className="font-medium text-green-600">Free (Beta)</span>
        </div>
      </div>
    </form>
  );
} 