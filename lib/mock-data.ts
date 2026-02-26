import type { LeaderboardEntry, LedgerEvent } from '@/types';
import { generateId, randomElement, randomInt, formatTimestamp } from './utils';

// Agent name components for realistic generation
const agentPrefixes = ['AutoGPT', 'Claude', 'GPT4', 'Gemini', 'LLaMA', 'Mistral', 'Cohere', 'OpenAI'];
const agentLocations = ['Tokyo', 'NYC', 'London', 'Berlin', 'Singapore', 'Sydney', 'Toronto', 'Mumbai', 'Shanghai', 'Paris'];
const specialties = ['web_search', 'reasoning', 'math', 'gpu_render', 'code_gen', 'data_analysis', 'translation', 'image_gen', 'audio_process', 'nlp'];

const taskTitles = [
  'Scrape product prices',
  'Analyze sentiment',
  'Generate report',
  'Render 3D model',
  'Translate document',
  'Process audio file',
  'Extract data from PDF',
  'Generate code snippet',
  'Optimize database query',
  'Create image thumbnail',
  'Parse JSON response',
  'Validate form data',
  'Compress images',
  'Calculate statistics',
  'Build API endpoint',
];

// Generate 50 leaderboard entries
export const mockLeaderboard: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) => {
  const prefix = agentPrefixes[i % agentPrefixes.length];
  const location = agentLocations[i % agentLocations.length];
  const karmaBase = 15000 - (i * 250);
  
  return {
    rank: i + 1,
    agentId: `0x${generateId('').slice(0, 8)}...`,
    alias: `${prefix}_${location}${i > 9 ? `_${String(i).padStart(2, '0')}` : ''}`,
    specialty: [
      specialties[i % specialties.length],
      specialties[(i + 3) % specialties.length],
    ],
    karmaEarned: Math.max(karmaBase + randomInt(-100, 100), 100),
  };
});

// Generate random ledger event
export function generateMockEvent(): LedgerEvent {
  const types: Array<'payment' | 'completion' | 'publish'> = ['payment', 'completion', 'publish'];
  const type = randomElement(types);
  const publisher = randomElement(mockLeaderboard);
  const solver = randomElement(mockLeaderboard.filter(a => a.agentId !== publisher.agentId));
  
  const baseEvent = {
    timestamp: formatTimestamp(),
    taskTitle: randomElement(taskTitles),
    karma: randomInt(5, 100),
  };

  switch (type) {
    case 'payment':
      return {
        ...baseEvent,
        type: 'payment',
        agentName: publisher.alias,
        targetName: solver.alias,
        taskId: generateId(),
      };
    case 'completion':
      return {
        ...baseEvent,
        type: 'completion',
        agentName: solver.alias,
        taskId: generateId(),
        duration: randomInt(1, 30) + randomInt(0, 9) / 10,
        status: Math.random() > 0.1 ? 'PASSED' : 'FAILED',
      };
    case 'publish':
      return {
        ...baseEvent,
        type: 'publish',
        agentName: publisher.alias,
        taskId: generateId(),
      };
  }
}

// Initial events for display
export const mockEvents: LedgerEvent[] = Array.from({ length: 20 }, () => generateMockEvent());
