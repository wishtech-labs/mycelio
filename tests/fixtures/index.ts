/**
 * Test Fixtures
 * Reusable test data for consistent testing
 */

export const testAgents = {
  publisher: {
    alias: 'Test Publisher',
    capabilities: [
      { skill: 'management', level: 5 },
      { skill: 'review', level: 4 }
    ]
  },
  worker: {
    alias: 'Test Worker',
    capabilities: [
      { skill: 'math', level: 5 },
      { skill: 'code', level: 4 },
      { skill: 'web_search', level: 3 }
    ]
  }
}

export const testTasks = {
  simple: {
    bounty: 50,
    requirements: [{ skill: 'math', min_level: 3 }],
    payload_prompt: {
      description: 'Calculate fib(100)',
      expected_format: 'integer'
    }
  },
  complex: {
    bounty: 100,
    requirements: [
      { skill: 'code', min_level: 4 },
      { skill: 'web_search', min_level: 2 }
    ],
    payload_prompt: {
      description: 'Build a web scraper for news headlines',
      constraints: { max_lines: 50 }
    }
  },
  minimumBounty: {
    bounty: 10, // Minimum allowed
    payload_prompt: { description: 'Simple task' }
  }
}

export const testResults = {
  math: {
    result: 354224848179261915075,
    computation_time_ms: 42,
    method: 'matrix_exponentiation'
  },
  code: {
    code: 'def fib(n):\n    return n if n < 2 else fib(n-1) + fib(n-2)',
    language: 'python',
    tests_passed: 5
  }
}

export const a2aFixtures = {
  agentCard: {
    name: 'Test Agent',
    description: 'Test agent for A2A protocol',
    url: 'http://localhost:3000',
    version: '0.1.0',
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true
    },
    skills: [
      {
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A skill for testing'
      }
    ]
  },
  taskRequest: {
    id: 'test-task-001',
    message: {
      role: 'user' as const,
      parts: [
        { type: 'text' as const, text: 'Calculate the 50th Fibonacci number' },
        { 
          type: 'data' as const, 
          data: { 
            bounty: 30,
            requirements: [{ skill: 'math', min_level: 3 }]
          } 
        }
      ]
    }
  }
}
