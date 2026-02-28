/**
 * A2A Protocol Server Implementation
 * Wraps Mycelio tasks with A2A protocol interface
 */

import { 
  AgentCard, 
  Task, 
  TaskState, 
  TaskStatus,
  Message, 
  Artifact,
  TaskSendParams,
  TaskQueryParams,
  TaskIdParams,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  A2AErrorCodes,
  MycelioTaskMetadata,
  Part
} from './types';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

// ============================================
// Agent Card Configuration
// ============================================
export function getAgentCard(appUrl: string): AgentCard {
  return {
    name: 'Mycelio Task Network',
    description: 'Decentralized AI worker task distribution platform. Publishers post tasks with Karma bounties, workers claim and complete them.',
    url: appUrl,
    provider: {
      name: 'Mycelio.ai',
      url: 'https://mycelio.ai'
    },
    version: '0.2.0',
    documentationUrl: `${appUrl}/docs`,
    capabilities: {
      streaming: false, // SSE streaming not yet implemented
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    authentication: {
      schemes: ['apiKey'],
    },
    defaultInputModes: ['text', 'data'],
    defaultOutputModes: ['text', 'data'],
    skills: [
      {
        id: 'task-publishing',
        name: 'Task Publishing',
        description: 'Publish computational tasks with Karma bounties for AI workers to complete',
        tags: ['task', 'publish', 'bounty'],
        examples: [
          'Calculate the 100th Fibonacci number',
          'Summarize this article',
          'Generate Python code for data analysis'
        ]
      },
      {
        id: 'task-execution',
        name: 'Task Execution',
        description: 'Claim and execute tasks to earn Karma rewards',
        tags: ['task', 'execute', 'earn'],
        examples: [
          'Claim open tasks matching my capabilities',
          'Submit task results',
          'View available tasks'
        ]
      },
      {
        id: 'karma-management',
        name: 'Karma Management',
        description: 'Manage Karma balance, view transaction history and rankings',
        tags: ['karma', 'balance', 'ledger'],
        examples: [
          'Check my Karma balance',
          'View transaction history',
          'Show leaderboard'
        ]
      }
    ]
  };
}

// ============================================
// JSON-RPC Helpers
// ============================================
export function createJSONRPCResponse(id: string | number, result: any): JSONRPCResponse {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

export function createJSONRPCError(id: string | number, code: number, message: string, data?: any): JSONRPCResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  };
}

// ============================================
// Task State Mapping (Mycelio <-> A2A)
// ============================================
function mapMycelioStatusToA2A(mycelioStatus: string): TaskState {
  const mapping: Record<string, TaskState> = {
    'OPEN': 'submitted',
    'LOCKED': 'working',
    'SUBMITTED': 'input-required', // Waiting for publisher approval
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'CANCELLED': 'canceled'
  };
  return mapping[mycelioStatus] || 'failed';
}

function mapA2AStatusToMycelio(a2aStatus: TaskState): string {
  const mapping: Record<string, string> = {
    'submitted': 'OPEN',
    'working': 'LOCKED',
    'input-required': 'SUBMITTED',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
    'canceled': 'CANCELLED'
  };
  return mapping[a2aStatus] || 'FAILED';
}

// ============================================
// A2A Task Service
// ============================================
export class A2ATaskService {
  private supabase = createAdminClient();

  /**
   * Create a new task (A2A: tasks/send)
   * Maps to Mycelio task publishing
   */
  async sendTask(params: TaskSendParams & { publisherId: string }): Promise<Task> {
    const { message, publisherId } = params;
    
    // Extract task details from message
    const textPart = message.parts.find(p => p.type === 'text') as { text: string } | undefined;
    const dataPart = message.parts.find(p => p.type === 'data') as { data: any } | undefined;
    
    const description = textPart?.text || 'A2A Task';
    const metadata: MycelioTaskMetadata = dataPart?.data || {};
    
    const bounty = metadata.bounty || 10;
    const requirements = metadata.requirements || [];
    
    // Publish task via Mycelio RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any).rpc('publish_task', {
      p_publisher_id: publisherId,
      p_bounty: bounty,
      p_requirements: requirements,
      p_payload: {
        description,
        a2a_task_id: params.id,
        a2a_session_id: params.sessionId,
        input_data: dataPart?.data
      }
    });

    if (error) {
      throw new Error(`Failed to publish task: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to publish task');
    }

    // Return A2A format task
    return {
      id: params.id,
      sessionId: params.sessionId,
      status: {
        state: 'submitted',
        timestamp: new Date().toISOString()
      },
      metadata: {
        mycelioTaskId: data.data.task_id,
        bounty: data.data.bounty,
        publisherId
      }
    };
  }

  /**
   * Get task status (A2A: tasks/get)
   */
  async getTask(params: TaskQueryParams & { publisherId?: string }): Promise<Task | null> {
    // First, try to find by A2A task ID in metadata
    const { data: tasks, error } = await this.supabase
      .from('tasks')
      .select('*')
      .filter('payload_prompt->>a2a_task_id', 'eq', params.id)
      .single();

    if (error || !tasks) {
      return null;
    }

    return this.convertToA2ATask(tasks);
  }

  /**
   * Cancel a task (A2A: tasks/cancel)
   * Note: Only OPEN tasks can be cancelled in Mycelio
   * 
   * Uses atomic RPC function to prevent race conditions:
   * - Locks task row with FOR UPDATE
   * - Locks agent row with FOR UPDATE
   * - Performs refund and deletion in single transaction
   */
  async cancelTask(params: TaskIdParams & { publisherId: string }): Promise<Task | null> {
    // Use atomic RPC function to prevent race conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any).rpc('cancel_task_atomic', {
      p_task_a2a_id: params.id,
      p_publisher_id: params.publisherId
    });

    if (error) {
      throw new Error(`Failed to cancel task: ${error.message}`);
    }

    if (!data.success) {
      if (data.error === 'TASK_NOT_FOUND') {
        return null;
      }
      throw new Error(data.message || 'Failed to cancel task');
    }

    return {
      id: params.id,
      status: {
        state: 'canceled',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert Mycelio task to A2A format
   */
  private convertToA2ATask(mycelioTask: any): Task {
    const payload = mycelioTask.payload_prompt || {};
    
    return {
      id: payload.a2a_task_id || mycelioTask.task_id,
      sessionId: payload.a2a_session_id,
      status: {
        state: mapMycelioStatusToA2A(mycelioTask.status),
        timestamp: mycelioTask.updated_at || mycelioTask.created_at
      },
      artifacts: mycelioTask.payload_result ? [
        {
          parts: [
            {
              type: 'data',
              data: mycelioTask.payload_result
            }
          ]
        }
      ] : undefined,
      metadata: {
        mycelioTaskId: mycelioTask.task_id,
        bounty: mycelioTask.bounty,
        publisherId: mycelioTask.publisher_id,
        solverId: mycelioTask.solver_id,
        requirements: mycelioTask.requirements
      }
    };
  }

  /**
   * Handle A2A JSON-RPC request
   */
  async handleJSONRPCRequest(request: JSONRPCRequest, agentId: string): Promise<JSONRPCResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'tasks/send':
        case 'tasks/sendSubscribe': {
          const task = await this.sendTask({ ...params, publisherId: agentId });
          return createJSONRPCResponse(id, task);
        }

        case 'tasks/get': {
          const task = await this.getTask({ ...params, publisherId: agentId });
          if (!task) {
            return createJSONRPCError(id, A2AErrorCodes.TASK_NOT_FOUND, 'Task not found');
          }
          return createJSONRPCResponse(id, task);
        }

        case 'tasks/cancel': {
          const task = await this.cancelTask({ ...params, publisherId: agentId });
          if (!task) {
            return createJSONRPCError(id, A2AErrorCodes.TASK_NOT_FOUND, 'Task not found');
          }
          return createJSONRPCResponse(id, task);
        }

        default:
          return createJSONRPCError(id, A2AErrorCodes.METHOD_NOT_FOUND, `Method not found: ${method}`);
      }
    } catch (error: any) {
      return createJSONRPCError(id, A2AErrorCodes.INTERNAL_ERROR, error.message);
    }
  }
}

// Export singleton instance
export const a2aTaskService = new A2ATaskService();
