"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackTransformer = exports.GetUserInfoSchema = exports.GetChannelsSchema = exports.GetUsersSchema = exports.SendMessageSchema = exports.SlackConfigSchema = void 0;
const zod_1 = require("zod");
/**
 * Slack-specific configuration schema
 */
exports.SlackConfigSchema = zod_1.z.object({
    nangoConnectionId: zod_1.z.string().min(1, 'Nango connection ID is required'),
    botToken: zod_1.z.string().optional(),
    appToken: zod_1.z.string().optional(),
    signingSecret: zod_1.z.string().optional(),
    defaultChannel: zod_1.z.string().optional(),
});
/**
 * Request schemas for Slack operations
 */
exports.SendMessageSchema = zod_1.z.object({
    channel: zod_1.z.string().min(1, 'Channel is required'),
    text: zod_1.z.string().min(1, 'Message text is required'),
    thread_ts: zod_1.z.string().optional(),
    reply_broadcast: zod_1.z.boolean().optional(),
    username: zod_1.z.string().optional(),
    icon_emoji: zod_1.z.string().optional(),
    icon_url: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.any()).optional(),
    blocks: zod_1.z.array(zod_1.z.any()).optional(),
});
exports.GetUsersSchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(1000).optional().default(100),
    include_locale: zod_1.z.boolean().optional(),
});
exports.GetChannelsSchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.number().min(1).max(1000).optional().default(100),
    exclude_archived: zod_1.z.boolean().optional().default(true),
    types: zod_1.z.string().optional().default('public_channel,private_channel'),
});
exports.GetUserInfoSchema = zod_1.z.object({
    user: zod_1.z.string().min(1, 'User ID is required'),
    include_locale: zod_1.z.boolean().optional(),
});
/**
 * Utility functions to convert Slack objects to standard format
 */
class SlackTransformer {
    /**
     * Convert Slack user to standard user format
     */
    static toStandardUser(slackUser) {
        var _a, _b, _c, _d, _e;
        return {
            id: slackUser.id,
            name: ((_a = slackUser.profile) === null || _a === void 0 ? void 0 : _a.display_name) || slackUser.real_name || slackUser.name,
            email: ((_b = slackUser.profile) === null || _b === void 0 ? void 0 : _b.email) || slackUser.email,
            avatar: ((_c = slackUser.profile) === null || _c === void 0 ? void 0 : _c.image_192) || slackUser.image_192,
            status: slackUser.presence === 'active' ? 'online' : 'offline',
            metadata: {
                isBot: slackUser.is_bot,
                isAppUser: slackUser.is_app_user,
                statusText: (_d = slackUser.profile) === null || _d === void 0 ? void 0 : _d.status_text,
                statusEmoji: (_e = slackUser.profile) === null || _e === void 0 ? void 0 : _e.status_emoji,
            },
        };
    }
    /**
     * Convert Slack channel to standard channel format
     */
    static toStandardChannel(slackChannel) {
        var _a, _b;
        let type = 'public';
        if (slackChannel.is_im) {
            type = 'direct';
        }
        else if (slackChannel.is_mpim || slackChannel.is_group) {
            type = 'group';
        }
        else if (slackChannel.is_private) {
            type = 'private';
        }
        return {
            id: slackChannel.id,
            name: slackChannel.name,
            description: ((_a = slackChannel.purpose) === null || _a === void 0 ? void 0 : _a.value) || ((_b = slackChannel.topic) === null || _b === void 0 ? void 0 : _b.value),
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
    static toStandardMessage(slackMessage, user, channel) {
        const attachments = [];
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
exports.SlackTransformer = SlackTransformer;
