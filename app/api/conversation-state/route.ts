import { NextRequest, NextResponse } from 'next/server';
import { ConversationStateSchema } from '@/lib/validations';
import { ValidationError, AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { ConversationState } from '@/types/conversation';

declare global {
  var conversationState: ConversationState | null;
}

// GET: Retrieve current conversation state
export async function GET() {
  try {
    if (!global.conversationState) {
      return NextResponse.json({
        success: true,
        state: null,
        message: 'No active conversation'
      });
    }
    
    return NextResponse.json({
      success: true,
      state: global.conversationState
    });
  } catch (error) {
    logger.error('Error getting conversation state', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// POST: Reset or update conversation state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = ConversationStateSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.format();
      logger.warn('Validation failed for conversation-state', { details });
      throw new ValidationError('Invalid request data', details);
    }

    const { action, data } = validation.data;
    
    switch (action) {
      case 'reset':
        global.conversationState = {
          conversationId: `conv-${Date.now()}`,
          startedAt: Date.now(),
          lastUpdated: Date.now(),
          context: {
            messages: [],
            edits: [],
            projectEvolution: { majorChanges: [] },
            userPreferences: {}
          }
        };
        
        logger.info('Reset conversation state');
        
        return NextResponse.json({
          success: true,
          message: 'Conversation state reset',
          state: global.conversationState
        });
        
      case 'clear-old':
        if (!global.conversationState) {
          global.conversationState = {
            conversationId: `conv-${Date.now()}`,
            startedAt: Date.now(),
            lastUpdated: Date.now(),
            context: {
              messages: [],
              edits: [],
              projectEvolution: { majorChanges: [] },
              userPreferences: {}
            }
          };
          
          logger.info('Initialized new conversation state for clear-old');
          
          return NextResponse.json({
            success: true,
            message: 'New conversation state initialized',
            state: global.conversationState
          });
        }
        
        global.conversationState.context.messages = global.conversationState.context.messages.slice(-5);
        global.conversationState.context.edits = global.conversationState.context.edits.slice(-3);
        global.conversationState.context.projectEvolution.majorChanges = 
          global.conversationState.context.projectEvolution.majorChanges.slice(-2);
        
        logger.info('Cleared old conversation data');
        
        return NextResponse.json({
          success: true,
          message: 'Old conversation data cleared',
          state: global.conversationState
        });
        
      case 'update':
        if (!global.conversationState) {
          throw new AppError('No active conversation to update', 400, 'NO_ACTIVE_CONVERSATION');
        }
        
        if (data) {
          if (data.currentTopic) {
            global.conversationState.context.currentTopic = data.currentTopic;
          }
          if (data.userPreferences) {
            global.conversationState.context.userPreferences = {
              ...global.conversationState.context.userPreferences,
              ...data.userPreferences
            };
          }
          
          global.conversationState.lastUpdated = Date.now();
        }
        
        logger.info('Updated conversation state', { topic: data?.currentTopic });
        
        return NextResponse.json({
          success: true,
          message: 'Conversation state updated',
          state: global.conversationState
        });
        
      default:
        throw new ValidationError('Invalid action');
    }
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    logger.error('Unexpected error in conversation-state', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// DELETE: Clear conversation state
export async function DELETE() {
  try {
    global.conversationState = null;
    logger.info('Cleared conversation state');
    
    return NextResponse.json({
      success: true,
      message: 'Conversation state cleared'
    });
  } catch (error) {
    logger.error('Error clearing conversation state', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}