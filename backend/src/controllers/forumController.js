const forumService = require('../services/forumService');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');

exports.createTopic = async (req, res) => {
  try {
    const topicData = {
      ...req.body,
      createdById: req.user.id
    };

    const topic = await forumService.createTopic(topicData);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_TOPIC_CREATE',
      actionDescription: `Created forum topic: ${topic.title}`,
      req,
      tableName: 'forum_topics',
      recordId: topic.id,
      metadata: { title: topic.title, category: topic.category }
    });

    // Emit real-time event
    socketService.emitToAll('FORUM_TOPIC_CREATE', { topic });

    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    console.error('Error in createTopic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
};

exports.getTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const result = await forumService.getTopic(id, userId);

    if (!result) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getTopic:', error);
    res.status(500).json({ error: 'Failed to retrieve topic' });
  }
};

exports.searchTopics = async (req, res) => {
  try {
    const { latitude, longitude, radius, page, limit, category, search, region } = req.query;
    const userId = req.user?.id || null;

    const searchParams = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    if (latitude && longitude) {
      searchParams.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
      searchParams.radius = parseInt(radius);
      searchParams.includeDistance = true;
    }

    if (category) searchParams.category = category;
    if (search) searchParams.search = search;
    if (region) searchParams.region = region;

    const result = await forumService.searchTopics(searchParams, userId);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in searchTopics:', error);
    res.status(500).json({ error: 'Failed to search topics' });
  }
};

exports.getNearbyTopics = async (req, res) => {
  try {
    const { latitude, longitude, radius, page, limit } = req.query;
    const userId = req.user?.id || null;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const result = await forumService.searchTopics({
      location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      radius: parseInt(radius),
      page: parseInt(page),
      limit: parseInt(limit),
      includeDistance: true
    }, userId);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getNearbyTopics:', error);
    res.status(500).json({ error: 'Failed to retrieve nearby topics' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      authorId: req.user.id
    };

    const post = await forumService.createPost(postData);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_POST_CREATE',
      actionDescription: `Created post in forum topic ${post.topicId}`,
      req,
      tableName: 'forum_posts',
      recordId: post.id,
      metadata: { topicId: post.topicId }
    });

    // Emit real-time event
    socketService.emitToRoom(`forum_${post.topicId}`, 'FORUM_POST_CREATE', { post });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

exports.reportContent = async (req, res) => {
  try {
    const moderationData = {
      ...req.body,
      moderator_id: req.user.id,
      action: 'flag'
    };

    const moderation = await forumService.moderateContent(moderationData);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_MODERATION_REPORT',
      actionDescription: `Reported content ${moderationData.contentId}`,
      req,
      tableName: 'forum_moderation',
      recordId: moderation.id,
      metadata: { contentId: moderationData.contentId, reason: moderationData.reason }
    });

    res.status(201).json({ success: true, data: moderation });
  } catch (error) {
    console.error('Error in reportContent:', error);
    res.status(500).json({ error: 'Failed to report content' });
  }
};

exports.moderateContent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to moderate content' });
    }

    const { id } = req.params;
    const { resolution } = req.body;

    const moderation = await forumService.resolveModeration(id, resolution, req.user.id);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_MODERATION_RESOLVE',
      actionDescription: `Resolved moderation ${id} with ${resolution}`,
      req,
      tableName: 'forum_moderation',
      recordId: id,
      metadata: { resolution }
    });

    res.json({ success: true, data: moderation });
  } catch (error) {
    console.error('Error in moderateContent:', error);
    res.status(500).json({ error: 'Failed to moderate content' });
  }
};

exports.joinForum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const member = await forumService.joinForum(userId, id);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_JOIN',
      actionDescription: `Joined forum ${id}`,
      req,
      tableName: 'forum_members',
      recordId: member.id,
      metadata: { forumId: id }
    });

    res.status(201).json({
      success: true,
      data: member,
      message: 'Successfully joined the forum'
    });
  } catch (error) {
    console.error('Error in joinForum:', error);
    if (error.message === 'Forum not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'User is already a member of this forum') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to join forum' });
  }
};

exports.leaveForum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await forumService.leaveForum(userId, id);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_LEAVE',
      actionDescription: `Left forum ${id}`,
      req,
      tableName: 'forum_members',
      metadata: { forumId: id }
    });

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error in leaveForum:', error);
    if (error.message === 'User is not a member of this forum') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to leave forum' });
  }
};

exports.getForumMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await forumService.getForumMembers(id);
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error in getForumMembers:', error);
    res.status(500).json({ error: 'Failed to retrieve forum members' });
  }
};

exports.syncOffline = async (req, res) => {
  try {
    const { changes } = req.body;
    await forumService.syncOfflineChanges(changes);
    res.json({ success: true, message: 'Changes synchronized successfully' });
  } catch (error) {
    console.error('Error in syncOffline:', error);
    res.status(500).json({ error: 'Failed to sync offline changes' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await forumService.getMessages(id, parseInt(page), parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, messageType } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await forumService.sendMessage(userId, id, content.trim(), messageType);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_MESSAGE_SEND',
      actionDescription: `Sent message in forum ${id}`,
      req,
      tableName: 'forum_messages',
      recordId: message.id,
      metadata: { forumId: id, messageType }
    });

    // Emit real-time event
    socketService.emitToRoom(`forum_${id}`, 'FORUM_MESSAGE', { message });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    if (error.message === 'You must be a member of this forum to send messages') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await forumService.deleteMessage(userId, messageId);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FORUM_MESSAGE_DELETE',
      actionDescription: `Deleted message ${messageId}`,
      req,
      tableName: 'forum_messages',
      recordId: messageId
    });

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    if (error.message === 'Message not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'You can only delete your own messages') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete message' });
  }
};