import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { theme } from '@/constants/theme';

export type AIModel = 'openai' | 'claude' | 'grok';
export type TaskType = 'creative_questions' | 'factual_questions' | 'current_affairs' | 'explanation_generation' | 'content_analysis';

interface AIModelConfig {
  name: string;
  strengths: TaskType[];
  apiKey: string | undefined;
  isAvailable: boolean;
  costPerRequest: number;
  responseTime: number; // in ms
}

interface AIRequest {
  taskType: TaskType;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  model: AIModel;
  responseTime: number;
  tokensUsed: number;
}

export class AIModelOrchestrator {
  private static models: Record<AIModel, AIModelConfig> = {
    openai: {
      name: 'OpenAI GPT-4',
      strengths: ['factual_questions', 'explanation_generation'],
      apiKey: process.env.OPENAI_API_KEY,
      isAvailable: !!process.env.OPENAI_API_KEY,
      costPerRequest: 0.03,
      responseTime: 2000,
    },
    claude: {
      name: 'Claude 3.5 Sonnet',
      strengths: ['creative_questions', 'content_analysis', 'explanation_generation'],
      apiKey: process.env.CLAUDE_API_KEY,
      isAvailable: !!process.env.CLAUDE_API_KEY,
      costPerRequest: 0.015,
      responseTime: 1500,
    },
    grok: {
      name: 'Grok Beta',
      strengths: ['current_affairs', 'creative_questions'],
      apiKey: process.env.GROK_API_KEY,
      isAvailable: !!process.env.GROK_API_KEY,
      costPerRequest: 0.01,
      responseTime: 1800,
    },
  };

  // Smart model selection based on task type and availability
  static selectOptimalModel(taskType: TaskType): AIModel {
    // Get models that excel at this task type
    const suitableModels = Object.entries(this.models)
      .filter(([_, config]) => config.isAvailable && config.strengths.includes(taskType))
      .sort((a, b) => a[1].costPerRequest - b[1].costPerRequest); // Sort by cost

    if (suitableModels.length > 0) {
      return suitableModels[0][0] as AIModel;
    }

    // Fallback to any available model
    const availableModels = Object.entries(this.models)
      .filter(([_, config]) => config.isAvailable);

    if (availableModels.length > 0) {
      return availableModels[0][0] as AIModel;
    }

    throw new Error('No AI models available');
  }

  // Load balancing - rotate between models to prevent rate limiting
  static rotateModels(): AIModel {
    const availableModels = Object.keys(this.models).filter(
      model => this.models[model as AIModel].isAvailable
    ) as AIModel[];

    if (availableModels.length === 0) {
      throw new Error('No AI models available');
    }

    // Simple round-robin selection
    const timestamp = Date.now();
    const index = Math.floor(timestamp / 10000) % availableModels.length;
    return availableModels[index];
  }

  // Execute AI request with automatic model selection
  static async executeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let selectedModel: AIModel;

    try {
      // Select optimal model for the task
      selectedModel = this.selectOptimalModel(request.taskType);
      
      // Execute request based on model
      const result = await this.callModel(selectedModel, request);
      
      return {
        success: true,
        data: result,
        model: selectedModel,
        responseTime: Date.now() - startTime,
        tokensUsed: this.estimateTokens(request.prompt, result),
      };
    } catch (error) {
      console.error(`AI request failed:`, error);
      
      // Try fallback model if primary fails
      try {
        const fallbackModel = this.rotateModels();
        if (fallbackModel !== selectedModel!) {
          const fallbackResult = await this.callModel(fallbackModel, request);
          
          return {
            success: true,
            data: fallbackResult,
            model: fallbackModel,
            responseTime: Date.now() - startTime,
            tokensUsed: this.estimateTokens(request.prompt, fallbackResult),
          };
        }
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
      }

      return {
        success: false,
        error: error.message,
        model: selectedModel!,
        responseTime: Date.now() - startTime,
        tokensUsed: 0,
      };
    }
  }

  // Call specific AI model
  private static async callModel(model: AIModel, request: AIRequest): Promise<any> {
    const config = this.models[model];
    
    switch (model) {
      case 'openai':
        return await this.callOpenAI(request, config.apiKey!);
      case 'claude':
        return await this.callClaude(request, config.apiKey!);
      case 'grok':
        return await this.callGrok(request, config.apiKey!);
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  private static async callOpenAI(request: AIRequest, apiKey: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.taskType),
          },
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private static async callClaude(request: AIRequest, apiKey: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: `${this.getSystemPrompt(request.taskType)}\n\n${request.prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private static async callGrok(request: AIRequest, apiKey: string): Promise<any> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.taskType),
          },
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.8,
        max_tokens: request.maxTokens || 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private static getSystemPrompt(taskType: TaskType): string {
    const prompts = {
      creative_questions: 'You are a creative educational content creator specializing in engaging, memorable quiz questions for Indian competitive exams. Make questions interesting and thought-provoking.',
      factual_questions: 'You are a factual accuracy expert for Indian competitive exams. Generate precise, well-researched questions with verified information.',
      current_affairs: 'You are a current affairs specialist with real-time knowledge of recent events in India and globally. Focus on exam-relevant recent developments.',
      explanation_generation: 'You are an expert educator who creates clear, comprehensive explanations for complex topics. Make explanations accessible and exam-focused.',
      content_analysis: 'You are a content analysis expert who can break down educational material into structured, learnable components.',
    };

    return prompts[taskType] || 'You are an AI assistant helping with educational content creation.';
  }

  private static estimateTokens(prompt: string, response: any): number {
    // Rough estimation: 1 token ≈ 4 characters
    const promptTokens = Math.ceil(prompt.length / 4);
    const responseTokens = Math.ceil((response?.length || 0) / 4);
    return promptTokens + responseTokens;
  }

  // Batch processing for multiple requests
  static async executeBatch(requests: AIRequest[]): Promise<AIResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.executeRequest(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason.message,
          model: 'openai' as AIModel,
          responseTime: 0,
          tokensUsed: 0,
        };
      }
    });
  }

  // Health check for all models
  static async healthCheck(): Promise<Record<AIModel, boolean>> {
    const healthResults: Record<AIModel, boolean> = {
      openai: false,
      claude: false,
      grok: false,
    };

    const testPrompt = 'Test connection. Respond with "OK".';

    for (const [modelName, config] of Object.entries(this.models)) {
      if (!config.isAvailable) continue;

      try {
        const result = await this.callModel(modelName as AIModel, {
          taskType: 'factual_questions',
          prompt: testPrompt,
          maxTokens: 10,
        });

        healthResults[modelName as AIModel] = result.includes('OK');
      } catch (error) {
        console.error(`Health check failed for ${modelName}:`, error);
        healthResults[modelName as AIModel] = false;
      }
    }

    return healthResults;
  }

  // Get model statistics
  static getModelStats(): Record<AIModel, AIModelConfig> {
    return { ...this.models };
  }
}

// React component for AI model status display
export function AIModelStatus() {
  const [modelHealth, setModelHealth] = useState<Record<AIModel, boolean>>({
    openai: false,
    claude: false,
    grok: false,
  });

  useEffect(() => {
    checkModelHealth();
  }, []);

  const checkModelHealth = async () => {
    try {
      const health = await AIModelOrchestrator.healthCheck();
      setModelHealth(health);
    } catch (error) {
      console.error('Error checking model health:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Models Status</Text>
      {Object.entries(modelHealth).map(([model, isHealthy]) => (
        <View key={model} style={styles.modelRow}>
          <View style={[styles.statusDot, { backgroundColor: isHealthy ? theme.colors.accent.green : theme.colors.accent.pink }]} />
          <Text style={styles.modelName}>{model.toUpperCase()}</Text>
          <Text style={styles.statusText}>{isHealthy ? 'Online' : 'Offline'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  title: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modelName: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
});