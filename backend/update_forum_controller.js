const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'forumController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add membership controller methods before the last export
const membershipControllers = `
// Forum Membership Controllers
exports.joinForum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const member = await forumService.joinForum(userId, id);
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
    res.json({ 
      success: true,
      message: result.message
    });
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
    res.json({ 
      success: true, 
      data: members
    });
  } catch (error) {
    console.error('Error in getForumMembers:', error);
    res.status(500).json({ error: 'Failed to retrieve forum members' });
  }
};
`;

// Insert before the last export (syncOffline is the last one)
const insertPoint = content.lastIndexOf('exports.syncOffline');
if (insertPoint !== -1) {
    content = content.slice(0, insertPoint) + membershipControllers + '\n' + content.slice(insertPoint);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated forumController.js');
} else {
    console.log('Could not find insertion point');
}
