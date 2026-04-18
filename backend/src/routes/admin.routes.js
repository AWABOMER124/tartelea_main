const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const { attachNormalizedRoles, requireAdminAccess } = require('../middlewares/rbac.middleware');
const AdminController = require('../controllers/admin.controller');

const router = express.Router();

router.use(authenticateUser, attachNormalizedRoles, requireAdminAccess);

router.get('/stats', AdminController.getStats);

router.get('/users', AdminController.listUsers);
router.patch('/users/:id/role', AdminController.updateUserRole);

router.get('/contents', AdminController.listContents);
router.post('/contents', AdminController.createContent);
router.put('/contents/:id', AdminController.updateContent);
router.delete('/contents/:id', AdminController.deleteContent);

router.get('/posts', AdminController.listPosts);
router.delete('/posts/:id', AdminController.deletePost);

router.get('/courses', AdminController.listCourses);
router.patch('/courses/:id/approval', AdminController.updateCourseApproval);

router.get('/workshops', AdminController.listWorkshops);
router.patch('/workshops/:id/approval', AdminController.updateWorkshopApproval);

router.get('/rooms', AdminController.listRooms);
router.patch('/rooms/:id/approval', AdminController.updateRoomApproval);

router.get('/pinned', AdminController.listPinned);
router.post('/pinned', AdminController.createPinned);
router.patch('/pinned/:id', AdminController.updatePinned);
router.delete('/pinned/:id', AdminController.deletePinned);

router.get('/notifications', AdminController.listNotifications);
router.get('/audit', AdminController.listAuditLogs);
router.post('/notifications/broadcast', AdminController.broadcastNotification);

module.exports = router;
