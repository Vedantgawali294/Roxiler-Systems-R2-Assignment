const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const Store = require("../models/Store");
const Rating = require("../models/Rating");
const User = require("../models/User");
const { Op } = require("sequelize");

const router = express.Router();

// @route   GET /api/user/stores
// @desc    Get all stores with ratings
// @access  Private - User
router.get("/stores", authenticateToken, authorizeRole("user", "admin"), async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const stores = await Store.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        },
        {
          model: Rating,
          attributes: ['rating'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating for each store
    const storesWithAvgRating = stores.rows.map(store => {
      const ratings = store.Ratings || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      
      return {
        ...store.toJSON(),
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: ratings.length,
        Ratings: undefined // Remove individual ratings from response
      };
    });

    res.json({
      stores: storesWithAvgRating,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(stores.count / limit),
        totalStores: stores.count,
        hasNextPage: offset + limit < stores.count,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/user/stores/:id
// @desc    Get single store details
// @access  Private - User
router.get("/stores/:id", authenticateToken, authorizeRole("user", "admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        },
        {
          model: Rating,
          include: [
            {
              model: User,
              attributes: ['name']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Calculate average rating
    const ratings = store.Ratings || [];
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    res.json({
      store: {
        ...store.toJSON(),
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: ratings.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/user/ratings
// @desc    Submit a rating for a store
// @access  Private - User
router.post("/ratings", authenticateToken, authorizeRole("user"), async (req, res) => {
  try {
    const { store_id, rating } = req.body;
    const user_id = req.user.id;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if store exists
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Check if user already rated this store
    const existingRating = await Rating.findOne({
      where: { user_id, store_id }
    });

    if (existingRating) {
      return res.status(400).json({ message: "You have already rated this store" });
    }

    // Create new rating
    const newRating = await Rating.create({
      user_id,
      store_id,
      rating
    });

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: newRating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/user/ratings/:id
// @desc    Update a rating
// @access  Private - User
router.put("/ratings/:id", authenticateToken, authorizeRole("user"), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const user_id = req.user.id;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Find the rating
    const existingRating = await Rating.findOne({
      where: { id, user_id }
    });

    if (!existingRating) {
      return res.status(404).json({ message: "Rating not found or unauthorized" });
    }

    // Update rating
    await existingRating.update({ rating });

    res.json({
      message: "Rating updated successfully",
      rating: existingRating
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/user/my-ratings
// @desc    Get user's ratings
// @access  Private - User
router.get("/my-ratings", authenticateToken, authorizeRole("user"), async (req, res) => {
  try {
    const user_id = req.user.id;

    const ratings = await Rating.findAll({
      where: { user_id },
      include: [
        {
          model: Store,
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ ratings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
