/**
 * RenderClient for Next.js Integration
 * Handles communication with the Render.com Manim rendering service
 */

export interface RenderRequest {
  script: string;
  quality?: 'low_quality' | 'medium_quality' | 'high_quality';
  format?: 'mp4' | 'mov' | 'avi';
  scene_name?: string;
  return_base64?: boolean;
}

export interface RenderResponse {
  success: boolean;
  request_id: string;
  video_file_path?: string;
  video_base64?: string;
  video_size_mb?: number;
  file_size?: number;
  render_time?: number;
  quality?: string;
  format?: string;
  scene_name?: string;
  timestamp: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface RenderStatus {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  message?: string;
  file_size?: number;
  download_url?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  storage: string;
}

export class RenderClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(options: {
    baseUrl: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = options.timeout || 300000; // 5 minutes default
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
  }

  /**
   * Check the health status of the Render.com service
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.makeRequest('/health', {
        method: 'GET',
        timeout: 10000, // 10 seconds for health check
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit a Manim script for rendering
   */
  async renderScript(request: RenderRequest): Promise<RenderResponse> {
    // Validate request
    this.validateRenderRequest(request);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🎬 Submitting render request (attempt ${attempt}/${this.retryAttempts})`);
        
        const response = await this.makeRequest('/render', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          timeout: this.timeout,
        });

        const result: RenderResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Render request failed: ${response.status} ${response.statusText}`);
        }

        console.log(`✅ Render request successful:`, {
          request_id: result.request_id,
          success: result.success,
          render_time: result.render_time,
          file_size: result.file_size,
          has_base64: !!result.video_base64,
          video_size_mb: result.video_size_mb
        });

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`❌ Render attempt ${attempt} failed:`, lastError.message);

        // Don't retry on validation errors or client errors (4xx)
        if (error instanceof Error && (
          error.message.includes('validation') ||
          error.message.includes('400') ||
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('404')
        )) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Get the status of a rendering request
   */
  async getRenderStatus(requestId: string): Promise<RenderStatus> {
    try {
      const response = await this.makeRequest(`/status/${requestId}`, {
        method: 'GET',
        timeout: 10000, // 10 seconds for status check
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a rendered video file
   */
  async downloadVideo(requestId: string): Promise<Blob> {
    try {
      const response = await this.makeRequest(`/download/${requestId}`, {
        method: 'GET',
        timeout: 60000, // 1 minute for download
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get download URL for a rendered video
   */
  getDownloadUrl(requestId: string): string {
    return `${this.baseUrl}/download/${requestId}`;
  }

  /**
   * Convert base64 video data to blob
   */
  base64ToBlob(base64Data: string, mimeType: string = 'video/mp4'): Blob {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Create object URL from base64 video data
   */
  createVideoUrl(base64Data: string): string {
    const blob = this.base64ToBlob(base64Data);
    return URL.createObjectURL(blob);
  }

  /**
   * Validate render request parameters
   */
  private validateRenderRequest(request: RenderRequest): void {
    if (!request.script || typeof request.script !== 'string' || request.script.trim().length === 0) {
      throw new Error('Script is required and must be a non-empty string');
    }

    if (request.quality && !['low_quality', 'medium_quality', 'high_quality'].includes(request.quality)) {
      throw new Error('Quality must be one of: low_quality, medium_quality, high_quality');
    }

    if (request.format && !['mp4', 'mov', 'avi'].includes(request.format)) {
      throw new Error('Format must be one of: mp4, mov, avi');
    }

    // Basic security check
    const dangerousPatterns = [
      'subprocess', 'os.system', 'eval(', 'exec(', '__import__',
      'compile(', 'globals(', 'locals(', 'open('
    ];

    for (const pattern of dangerousPatterns) {
      if (request.script.includes(pattern)) {
        throw new Error(`Script contains potentially dangerous code: ${pattern}`);
      }
    }

    // Check for required Manim imports
    if (!request.script.includes('from manim import') && !request.script.includes('import manim')) {
      throw new Error('Script must import manim');
    }

    // Check for Scene class
    if (!request.script.includes('class') || !request.script.includes('Scene')) {
      throw new Error('Script must contain a Scene class');
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async makeRequest(endpoint: string, options: RequestInit & { timeout?: number }): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a RenderClient instance with environment-based configuration
 */
export function createRenderClient(): RenderClient {
  const baseUrl = process.env.RENDER_SERVICE_URL || process.env.NEXT_PUBLIC_RENDER_SERVICE_URL;
  
  if (!baseUrl) {
    throw new Error('RENDER_SERVICE_URL or NEXT_PUBLIC_RENDER_SERVICE_URL environment variable is required');
  }

  return new RenderClient({
    baseUrl,
    timeout: parseInt(process.env.RENDER_TIMEOUT || '300000'), // 5 minutes
    retryAttempts: parseInt(process.env.RENDER_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.RENDER_RETRY_DELAY || '1000'), // 1 second
  });
}

/**
 * Utility function to estimate rendering time based on script complexity
 */
export function estimateRenderTime(script: string, quality: string = 'medium_quality'): number {
  // Basic estimation based on script length and complexity indicators
  const baseTime = 30; // 30 seconds base time
  const scriptLength = script.length;
  const complexityFactors = {
    'low_quality': 0.5,
    'medium_quality': 1.0,
    'high_quality': 2.0,
  };

  // Count complexity indicators
  const complexityIndicators = [
    'Transform', 'Animation', 'play(', 'wait(', 'FadeIn', 'FadeOut',
    'Write', 'Create', 'MathTex', 'Text', 'Circle', 'Square', 'Line'
  ];

  let complexityScore = 0;
  for (const indicator of complexityIndicators) {
    const matches = (script.match(new RegExp(indicator, 'g')) || []).length;
    complexityScore += matches;
  }

  // Calculate estimated time
  const lengthFactor = Math.min(scriptLength / 1000, 5); // Max 5x for length
  const complexityFactor = Math.min(complexityScore / 10, 3); // Max 3x for complexity
  const qualityFactor = complexityFactors[quality as keyof typeof complexityFactors] || 1;

  const estimatedTime = baseTime * (1 + lengthFactor + complexityFactor) * qualityFactor;

  return Math.round(estimatedTime);
}

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to format render time
 */
export function formatRenderTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
} 