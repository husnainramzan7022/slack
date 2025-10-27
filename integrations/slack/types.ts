import { z } from 'zod';
import {
  StandardUser,
  StandardChannel,
  StandardMessage,
  MessageAttachment,
} from '../common/types';

/**
 * Slack-specific configuration schema
 */
export const SlackConfigSchema = z.object({
  nangoConnectionId: z.string().min(1, 'Nango connection ID is required'),
  botToken: z.string().optional(),
  appToken: z.string().optional(),
  signingSecret: z.string().optional(),
  defaultChannel: z.string().optional(),
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;

/**
 * Slack API response types
 */
export interface SlackApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
  response_metadata?: {
    next_cursor?: string;
    messages?: string[];
  };
}

/**
 * Slack user object from API
 */
export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  display_name?: string;
  email?: string;
  image_24?: string;
  image_32?: string;
  image_48?: string;
  image_72?: string;
  image_192?: string;
  image_512?: string;
  is_bot?: boolean;
  is_app_user?: boolean;
  presence?: string;
  profile?: {
    real_name?: string;
    display_name?: string;
    email?: string;
    image_24?: string;
    image_32?: string;
    image_48?: string;
    image_72?: string;
    image_192?: string;
    image_512?: string;
    status_text?: string;
    status_emoji?: string;
  };
}

/**
 * Slack channel object from API
 */
export interface SlackChannel {
  id: string;
  name: string;
  is_channel?: boolean;
  is_group?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  is_archived?: boolean;
  is_general?: boolean;
  is_shared?: boolean;
  is_org_shared?: boolean;
  is_member?: boolean;
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  num_members?: number;
}

/**
 * Slack message object from API
 */
export interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
  user?: string;
  bot_id?: string;
  app_id?: string;
  text: string;
  username?: string;
  channel?: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  files?: SlackFile[];
  attachments?: SlackAttachment[];
}

/**
 * Slack file object
 */
export interface SlackFile {
  id: string;
  name?: string;
  title?: string;
  mimetype?: string;
  filetype?: string;
  pretty_type?: string;
  user?: string;
  size?: number;
  url_private?: string;
  url_private_download?: string;
  permalink?: string;
  permalink_public?: string;
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
}

/**
 * Slack attachment object
 */
export interface SlackAttachment {
  id?: string;
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

/**
 * Request schemas for Slack operations
 */
export const SendMessageSchema = z.object({
  channel: z.string().min(1, 'Channel is required'),
  text: z.string().min(1, 'Message text is required'),
  thread_ts: z.string().optional(),
  reply_broadcast: z.boolean().optional(),
  username: z.string().optional(),
  icon_emoji: z.string().optional(),
  icon_url: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  blocks: z.array(z.any()).optional(),
});

export const GetUsersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  include_locale: z.boolean().optional(),
});

export const GetChannelsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  exclude_archived: z.boolean().optional().default(true),
  types: z.string().optional().default('public_channel,private_channel'),
});

export const GetUserInfoSchema = z.object({
  user: z.string().min(1, 'User ID is required'),
  include_locale: z.boolean().optional(),
});

/**
 * Response types for Slack operations
 */
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type GetUsersRequest = z.infer<typeof GetUsersSchema>;
export type GetChannelsRequest = z.infer<typeof GetChannelsSchema>;
export type GetUserInfoRequest = z.infer<typeof GetUserInfoSchema>;

/**
 * Utility functions to convert Slack objects to standard format
 */
export class SlackTransformer {
  /**
   * Convert Slack user to standard user format
   */
  static toStandardUser(slackUser: SlackUser): StandardUser {
    return {
      id: slackUser.id,
      name: slackUser.profile?.display_name || slackUser.real_name || slackUser.name,
      email: slackUser.profile?.email || slackUser.email,
      avatar: slackUser.profile?.image_192 || slackUser.image_192,
      status: slackUser.presence === 'active' ? 'online' : 'offline',
      metadata: {
        isBot: slackUser.is_bot,
        isAppUser: slackUser.is_app_user,
        statusText: slackUser.profile?.status_text,
        statusEmoji: slackUser.profile?.status_emoji,
      },
    };
  }

  /**
   * Convert Slack channel to standard channel format
   */
  static toStandardChannel(slackChannel: SlackChannel): StandardChannel {
    let type: StandardChannel['type'] = 'public';
    
    if (slackChannel.is_im) {
      type = 'direct';
    } else if (slackChannel.is_mpim || slackChannel.is_group) {
      type = 'group';
    } else if (slackChannel.is_private) {
      type = 'private';
    }

    return {
      id: slackChannel.id,
      name: slackChannel.name,
      description: slackChannel.purpose?.value || slackChannel.topic?.value,
      type,
      memberCount: slackChannel.num_members,
      metadata: {
        isArchived: slackChannel.is_archived,
        isGeneral: slackChannel.is_general,
        isShared: slackChannel.is_shared,
        isMember: slackChannel.is_member,
      },
    };
  }

  /**
   * Convert Slack message to standard message format
   */
  static toStandardMessage(
    slackMessage: SlackMessage,
    user: StandardUser,
    channel: StandardChannel
  ): StandardMessage {
    const attachments: MessageAttachment[] = [];

    // Convert files to attachments
    if (slackMessage.files) {
      slackMessage.files.forEach(file => {
        attachments.push({
          id: file.id,
          name: file.name || file.title || 'Untitled',
          type: file.mimetype || file.filetype || 'unknown',
          url: file.url_private || file.permalink || '',
          size: file.size,
          metadata: {
            prettyType: file.pretty_type,
            thumb64: file.thumb_64,
            thumb360: file.thumb_360,
          },
        });
      });
    }

    return {
      id: slackMessage.ts,
      content: slackMessage.text,
      sender: user,
      channel,
      timestamp: new Date(parseFloat(slackMessage.ts) * 1000).toISOString(),
      type: 'text',
      attachments,
      metadata: {
        threadTs: slackMessage.thread_ts,
        replyCount: slackMessage.reply_count,
        reactions: slackMessage.reactions,
        subtype: slackMessage.subtype,
      },
    };
  }
}