import { Queue } from 'bullmq';
import { connection } from './redis';

export const workflowQueue = new Queue('workflow', {
  connection,
});
