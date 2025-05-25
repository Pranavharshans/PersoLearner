'use client';

import React, { useState } from 'react';
import ModelSelector from '@/components/ModelSelector';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'models' | 'general' | 'advanced'>('models');
  const [selectedComplexity, setSelectedComplexity] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [selectedStyle, setSelectedStyle] = useState<'mathematical' | 'scientific' | 'general'>('general');

  const tabs = [
    { id: 'models', label: 'AI Models', icon: '🤖' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Default Content Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Complexity Level
            </label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value as any)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="beginner">Beginner - Simple concepts and basic animations</option>
              <option value="intermediate">Intermediate - Balanced explanations and engaging animations</option>
              <option value="advanced">Advanced - Sophisticated concepts and detailed explanations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Style
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as any)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="mathematical">Mathematical - Focus on equations and mathematical visualizations</option>
              <option value="scientific">Scientific - Emphasize diagrams, charts, and scientific concepts</option>
              <option value="general">General - Versatile approach suitable for any topic</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Video Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Duration (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              defaultValue="60"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video Quality
            </label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="1440p">1440p (2K)</option>
              <option value="2160p">2160p (4K)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frame Rate
            </label>
            <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Preferences
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Include narration by default
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Auto-save generated scripts
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Enable dark mode
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Show performance metrics
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          API Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              OpenRouter API Key
            </label>
            <div className="flex">
              <input
                type="password"
                placeholder="sk-or-..."
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button className="px-4 py-3 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors">
                Test
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required for AI script generation. Get your key from{' '}
              <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                OpenRouter.ai
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Google Cloud Project ID
            </label>
            <input
              type="text"
              placeholder="your-project-id"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for video rendering via Google Cloud Run
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Performance & Debugging
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Enable detailed logging
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Track model performance metrics
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Enable experimental features
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Cache & Storage
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Clear Generated Scripts Cache</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remove all cached script generations</p>
            </div>
            <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
              Clear Cache
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Reset All Settings</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Restore all settings to default values</p>
            </div>
            <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Settings & Configuration
            </h1>
            <p className="text-xl text-gray-300">
              Customize your ManimNext experience
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-md transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
            {activeTab === 'models' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    AI Model Configuration
                  </h2>
                  <p className="text-gray-300">
                    Select and configure AI models for script generation. Models are automatically 
                    recommended based on your content complexity and style preferences.
                  </p>
                </div>
                
                <ModelSelector
                  complexity={selectedComplexity}
                  style={selectedStyle}
                  showAdvanced={true}
                  onModelChange={(modelId) => {
                    console.log('Model changed to:', modelId);
                  }}
                />
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    General Settings
                  </h2>
                  <p className="text-gray-300">
                    Configure default settings for content generation and video output.
                  </p>
                </div>
                
                {renderGeneralSettings()}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Advanced Configuration
                  </h2>
                  <p className="text-gray-300">
                    Advanced settings for API configuration, performance tuning, and debugging.
                  </p>
                </div>
                
                {renderAdvancedSettings()}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-center mt-8">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg">
              Save Settings
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 