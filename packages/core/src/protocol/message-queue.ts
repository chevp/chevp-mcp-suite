/**
 * Message Queue for MCP Communication
 *
 * Provides async message passing between MCP servers via the shared context store.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  MCPMessage,
  MCPRole,
  MessageType,
  Priority,
  MessagePayload,
  SharedContext,
  MessageStatus,
} from './types.js';

export interface MessageQueueConfig {
  contextStorePath: string;
}

export class MessageQueue {
  private contextStorePath: string;
  private pendingPath: string;
  private processedPath: string;
  private escalationsPath: string;

  constructor(config: MessageQueueConfig) {
    this.contextStorePath = config.contextStorePath;
    this.pendingPath = path.join(this.contextStorePath, 'messages', 'pending');
    this.processedPath = path.join(this.contextStorePath, 'messages', 'processed');
    this.escalationsPath = path.join(this.contextStorePath, 'messages', 'escalations');

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.pendingPath, this.processedPath, this.escalationsPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Send a message to another MCP
   */
  async send(message: Omit<MCPMessage, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const id = randomUUID();
    const fullMessage: MCPMessage = {
      ...message,
      id,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    const filename = `${id}.json`;
    const filepath = path.join(this.pendingPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(fullMessage, null, 2));

    return id;
  }

  /**
   * Broadcast a message to multiple MCPs
   */
  async broadcast(
    message: Omit<MCPMessage, 'id' | 'timestamp' | 'status' | 'to'>,
    recipients: MCPRole[]
  ): Promise<string[]> {
    const correlationId = randomUUID();
    const messageIds: string[] = [];

    for (const recipient of recipients) {
      const id = await this.send({
        ...message,
        to: recipient,
        correlationId,
      });
      messageIds.push(id);
    }

    return messageIds;
  }

  /**
   * Get pending messages for a specific MCP role
   */
  async getPendingMessages(role: MCPRole): Promise<MCPMessage[]> {
    const files = fs.readdirSync(this.pendingPath).filter((f) => f.endsWith('.json'));
    const messages: MCPMessage[] = [];

    for (const file of files) {
      const filepath = path.join(this.pendingPath, file);
      const content = fs.readFileSync(filepath, 'utf8');
      const message = JSON.parse(content) as MCPMessage;

      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      if (recipients.includes(role)) {
        messages.push(message);
      }
    }

    return messages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Mark a message as processed
   */
  async markProcessed(messageId: string, success: boolean, result?: unknown): Promise<void> {
    const pendingFile = path.join(this.pendingPath, `${messageId}.json`);

    if (!fs.existsSync(pendingFile)) {
      throw new Error(`Message ${messageId} not found`);
    }

    const content = fs.readFileSync(pendingFile, 'utf8');
    const message = JSON.parse(content) as MCPMessage;

    message.status = success ? 'completed' : 'failed';

    const processedFile = path.join(this.processedPath, `${messageId}.json`);
    fs.writeFileSync(
      processedFile,
      JSON.stringify(
        {
          ...message,
          processedAt: new Date().toISOString(),
          result,
        },
        null,
        2
      )
    );

    fs.unlinkSync(pendingFile);
  }

  /**
   * Create an escalation
   */
  async escalate(
    from: MCPRole,
    to: MCPRole,
    originalMessage: MCPMessage,
    blocker: string,
    attemptedResolution: string,
    options: Array<{ id: string; description: string; impact: string; recommendation: boolean }>
  ): Promise<string> {
    const id = randomUUID();
    const escalation: MCPMessage = {
      id,
      type: 'escalation',
      from,
      to,
      priority: 'high',
      timestamp: new Date().toISOString(),
      requiresResponse: true,
      payload: {
        action: 'escalate',
        parameters: {
          originalRequest: originalMessage,
          blocker,
          attemptedResolution,
          options,
        },
      },
      status: 'pending',
    };

    const filename = `${id}.json`;
    const filepath = path.join(this.escalationsPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(escalation, null, 2));

    return id;
  }

  /**
   * Get all active escalations
   */
  async getEscalations(role?: MCPRole): Promise<MCPMessage[]> {
    const files = fs.readdirSync(this.escalationsPath).filter((f) => f.endsWith('.json'));
    const escalations: MCPMessage[] = [];

    for (const file of files) {
      const filepath = path.join(this.escalationsPath, file);
      const content = fs.readFileSync(filepath, 'utf8');
      const message = JSON.parse(content) as MCPMessage;

      if (!role || message.to === role) {
        escalations.push(message);
      }
    }

    return escalations;
  }

  /**
   * Create a response to a message
   */
  async respond(
    originalMessageId: string,
    from: MCPRole,
    payload: MessagePayload
  ): Promise<string> {
    const pendingFile = path.join(this.pendingPath, `${originalMessageId}.json`);
    const processedFile = path.join(this.processedPath, `${originalMessageId}.json`);

    let originalMessage: MCPMessage;

    if (fs.existsSync(pendingFile)) {
      originalMessage = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
    } else if (fs.existsSync(processedFile)) {
      originalMessage = JSON.parse(fs.readFileSync(processedFile, 'utf8'));
    } else {
      throw new Error(`Original message ${originalMessageId} not found`);
    }

    return this.send({
      type: 'response',
      from,
      to: originalMessage.from,
      priority: originalMessage.priority,
      replyTo: originalMessageId,
      correlationId: originalMessage.correlationId,
      payload,
      requiresResponse: false,
    });
  }
}

/**
 * Create a message queue instance with default configuration
 */
export function createMessageQueue(contextStorePath?: string): MessageQueue {
  const defaultPath =
    contextStorePath ??
    process.env.MCP_CONTEXT_STORE ??
    'c:/chevp/tools/chevp-mcp-suite/context-store';

  return new MessageQueue({ contextStorePath: defaultPath });
}
