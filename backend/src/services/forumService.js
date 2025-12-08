const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { ForumTopic, ForumPost, ForumModeration, ForumMember, ForumMessage, User } = require('../models');

class ForumService {
  async createTopic(topicData) {
    // Ensure location is properly formatted if provided
    if (topicData.region && !topicData.location) {
      topicData.location = { region: topicData.region };
    }
    const topic = await ForumTopic.create(topicData);

    // Automatically add creator as admin member
    await ForumMember.create({
      userId: topicData.createdById,
      forumId: topic.id,
      role: 'admin',
      joinedAt: new Date()
    });

    return topic;
  }

  async getTopic(topicId, userId = null) {
    const topic = await ForumTopic.findByPk(topicId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'profile_image_url'] },
        {
          model: ForumPost,
          as: 'posts',
          include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name', 'profile_image_url'] }]
        },
        {
          model: ForumMember,
          as: 'members'
        }
      ],
      order: [[{ model: ForumPost, as: 'posts' }, 'createdAt', 'ASC']]
    });

    if (!topic) return null;

    // Convert to plain object and add computed fields
    const topicData = topic.toJSON();
    topicData.memberCount = topicData.members ? topicData.members.length : 0;
    topicData.isMember = userId ? topicData.members?.some(m => m.userId === userId) : false;
    topicData.region = topicData.location?.region || null;

    return topicData;
  }

  async searchTopics(query, userId = null) {
    const { search, category, region, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const where = { status: 'active' };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      where.category = category;
    }

    // Region filter - normalize by removing hyphens and comparing case-insensitively
    if (region) {
      const normalizedRegion = region.replace(/-/g, '').toLowerCase();
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        Sequelize.where(
          Sequelize.fn('LOWER',
            Sequelize.fn('REPLACE',
              Sequelize.fn('jsonb_extract_path_text', Sequelize.col('location'), 'region'),
              '-', ''
            )
          ),
          { [Op.like]: `%${normalizedRegion}%` }
        )
      );
    }

    const { count, rows } = await ForumTopic.findAndCountAll({
      where,
      limit,
      offset,
      order: [['lastPostAt', 'DESC'], ['createdAt', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'profile_image_url'] },
        { model: ForumMember, as: 'members' }
      ]
    });

    // Enrich each topic with memberCount and isMember
    const enrichedTopics = rows.map(topic => {
      const topicData = topic.toJSON();
      topicData.memberCount = topicData.members ? topicData.members.length : 0;
      topicData.isMember = userId ? topicData.members?.some(m => m.userId === userId) : false;
      topicData.region = topicData.location?.region || null;
      return topicData;
    });

    return {
      topics: enrichedTopics,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async createPost(postData) {
    const post = await ForumPost.create(postData);

    // Update lastPostAt on the topic
    await ForumTopic.update(
      { lastPostAt: new Date() },
      { where: { id: postData.topicId } }
    );

    // Fetch the created post with author details
    const createdPost = await ForumPost.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name', 'profile_image_url'] }]
    });

    return createdPost;
  }

  async moderateContent(moderationData) {
    return await ForumModeration.create(moderationData);
  }

  async resolveModeration(id, resolution, moderatorId) {
    const moderation = await ForumModeration.findByPk(id);
    if (!moderation) throw new Error('Moderation log not found');

    await moderation.update({
      status: 'resolved',
      resolution,
      resolvedBy: moderatorId,
      resolvedAt: new Date()
    });

    return moderation;
  }

  async joinForum(userId, forumId, role = 'member') {
    const forum = await ForumTopic.findByPk(forumId);
    if (!forum) {
      throw new Error('Forum not found');
    }

    const existingMember = await ForumMember.findOne({
      where: { userId, forumId }
    });

    if (existingMember) {
      throw new Error('User is already a member of this forum');
    }

    const member = await ForumMember.create({
      userId,
      forumId,
      role,
      joinedAt: new Date()
    });

    return member;
  }

  async leaveForum(userId, forumId) {
    const member = await ForumMember.findOne({
      where: { userId, forumId }
    });

    if (!member) {
      throw new Error('User is not a member of this forum');
    }

    await member.destroy();
    return { message: 'Successfully left the forum' };
  }

  async getForumMembers(forumId) {
    const members = await ForumMember.findAll({
      where: { forumId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'profile_image_url', 'region']
        }
      ],
      order: [['joinedAt', 'ASC']]
    });

    return members;
  }

  async checkMembership(userId, forumId) {
    const member = await ForumMember.findOne({
      where: { userId, forumId }
    });

    return member !== null;
  }

  // Chat Message Methods
  async getMessages(forumId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const { count, rows } = await ForumMessage.findAndCountAll({
      where: { forumId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_image_url']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      messages: rows.reverse(), // Return in chronological order for display
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    };
  }

  async sendMessage(userId, forumId, content, messageType = 'text') {
    // Check if user is a member
    const isMember = await this.checkMembership(userId, forumId);
    if (!isMember) {
      throw new Error('You must be a member of this forum to send messages');
    }

    const message = await ForumMessage.create({
      userId,
      forumId,
      content,
      messageType
    });

    // Fetch with sender info
    const createdMessage = await ForumMessage.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_image_url']
        }
      ]
    });

    return createdMessage;
  }

  async deleteMessage(userId, messageId) {
    const message = await ForumMessage.findByPk(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      throw new Error('You can only delete your own messages');
    }

    await message.destroy();
    return { message: 'Message deleted successfully' };
  }

  async syncOfflineChanges(changes) {
    console.log('Syncing offline changes:', changes);
    return true;
  }
}

module.exports = new ForumService();