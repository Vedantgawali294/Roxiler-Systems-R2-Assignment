const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const Store = require("../models/Store");
const Rating = require("../models/Rating");
const User = require("../models/User");

const router = express.Router();

// @route   POST /api/owner/stores
// @desc    Create a new store
// @access  Private - Owner
router.post("/stores", authenticateToken, authorizeRole("owner"), async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const owner_id = req.user.id;

    // Check if store with email already exists
    const existingStore = await Store.findOne({ where: { email } });
    if (existingStore) {
      return res.status(400).json({ message: "Store with this email already exists" });
    }

    // Create store
    const store = await Store.create({
      name,
      email,
      address,
      owner_id
    });

    res.status(201).json({
      message: "Store created successfully",
      store
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/owner/my-stores
// @desc    Get owner's stores
// @access  Private - Owner
router.get("/my-stores", authenticateToken, authorizeRole("owner"), async (req, res) => {
  try {
    const owner_id = req.user.id;

    const stores = await Store.findAll({
      where: { owner_id },
      include: [
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

    // Calculate statistics for each store
    const storesWithStats = stores.map(store => {
      const ratings = store.Ratings || [];
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;
      
      // Rating distribution
      const ratingDistribution = {
        1: ratings.filter(r => r.rating === 1).length,
        2: ratings.filter(r => r.rating === 2).length,
        3: ratings.filter(r => r.rating === 3).length,
        4: ratings.filter(r => r.rating === 4).length,
        5: ratings.filter(r => r.rating === 5).length
      };

      return {
        ...store.toJSON(),
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings,
        ratingDistribution
      };
    });

    res.json({ stores: storesWithStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/owner/stores/:id/ratings
// @desc    Get detailed ratings for a specific store
// @access  Private - Owner
router.get("/stores/:id/ratings", authenticateToken, authorizeRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const owner_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Check if store belongs to owner
    const store = await Store.findOne({
      where: { id, owner_id }
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found or unauthorized" });
    }

    const ratings = await Rating.findAndCountAll({
      where: { store_id: id },
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    const allRatings = await Rating.findAll({
      where: { store_id: id },
      attributes: ['rating']
    });

    const avgRating = allRatings.length > 0 
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length 
      : 0;

    res.json({
      store: {
        id: store.id,
        name: store.name,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: allRatings.length
      },
      ratings: ratings.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(ratings.count / limit),
        totalRatings: ratings.count,
        hasNextPage: offset + limit < ratings.count,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   GET /api/owner/dashboard
// @desc    Get owner dashboard statistics
// @access  Private - Owner
router.get("/dashboard", authenticateToken, authorizeRole("owner"), async (req, res) => {
  try {
    const owner_id = req.user.id;

    // Get all stores owned by this owner
    const stores = await Store.findAll({
      where: { owner_id },
      include: [
        {
          model: Rating,
          attributes: ['rating', 'createdAt']
        }
      ]
    });

    // Calculate overall statistics
    let totalStores = stores.length;
    let totalRatings = 0;
    let totalRatingSum = 0;
    let recentRatings = [];

    stores.forEach(store => {
      const storeRatings = store.Ratings || [];
      totalRatings += storeRatings.length;
      totalRatingSum += storeRatings.reduce((sum, r) => sum + r.rating, 0);
      
      // Collect recent ratings
      recentRatings = recentRatings.concat(
        storeRatings.map(rating => ({
          ...rating.toJSON(),
          storeName: store.name,
          storeId: store.id
        }))
      );
    });

    // Sort recent ratings by date and limit to 10
    recentRatings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentRatings = recentRatings.slice(0, 10);

    const overallAvgRating = totalRatings > 0 ? totalRatingSum / totalRatings : 0;

    res.json({
      dashboard: {
        totalStores,
        totalRatings,
        overallAverageRating: parseFloat(overallAvgRating.toFixed(1)),
        recentRatings,
        stores: stores.map(store => {
          const storeRatings = store.Ratings || [];
          const storeAvg = storeRatings.length > 0 
            ? storeRatings.reduce((sum, r) => sum + r.rating, 0) / storeRatings.length 
            : 0;
          
          return {
            id: store.id,
            name: store.name,
            totalRatings: storeRatings.length,
            averageRating: parseFloat(storeAvg.toFixed(1))
          };
        })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   PUT /api/owner/stores/:id
// @desc    Update store details
// @access  Private - Owner
router.put("/stores/:id", authenticateToken, authorizeRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address } = req.body;
    const owner_id = req.user.id;

    // Check if store belongs to owner
    const store = await Store.findOne({
      where: { id, owner_id }
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found or unauthorized" });
    }

    // Update store
    await store.update({ name, email, address });

    res.json({
      message: "Store updated successfully",
      store
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/owner/stores/:id
// @desc    Delete a store
// @access  Private - Owner
router.delete("/stores/:id", authenticateToken, authorizeRole("owner"), async (req, res) => {
  try {
    const storeId = req.params.id;
    const owner_id = req.user.id;

    // Find the store
    const store = await Store.findOne({ 
      where: { 
        id: storeId,
        owner_id 
      }
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found or you don't have permission to delete it" });
    }

    // Delete all ratings associated with this store first
    await Rating.destroy({
      where: { store_id: storeId }
    });

    // Delete the store
    await store.destroy();

    res.json({
      message: "Store deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
