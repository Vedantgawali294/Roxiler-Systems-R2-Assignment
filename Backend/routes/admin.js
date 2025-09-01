const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const User = require("../models/User");
const Store = require("../models/Store");
const Rating = require("../models/Rating");
const { Op } = require("sequelize");

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private - Admin only
router.get("/dashboard", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStores = await Store.count();
    const totalRatings = await Rating.count();
    
    const usersByRole = await User.findAll({
      attributes: ['role', [User.sequelize.fn('COUNT', User.sequelize.col('role')), 'count']],
      group: ['role']
    });

    const avgRating = await Rating.findOne({
      attributes: [[Rating.sequelize.fn('AVG', Rating.sequelize.col('rating')), 'avgRating']]
    });

    res.json({
      stats: {
        totalUsers,
        totalStores,
        totalRatings,
        averageRating: parseFloat(avgRating.dataValues.avgRating) || 0,
        usersByRole
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private - Admin only
router.get("/users", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'address', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private - Admin only
router.put("/users/:id", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, address } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ name, email, role, address });

    res.json({
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private - Admin only
router.delete("/users/:id", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/admin/stores
// @desc    Get all stores
// @access  Private - Admin only
router.get("/stores", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const stores = await Store.findAll({
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ stores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
