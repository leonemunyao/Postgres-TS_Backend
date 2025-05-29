import { Express, Request, Response } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken } from "../middleware/auth";
import { isAdmin } from "../middleware/isAdmin";

const router = require("express").Router();
const userController = new UserController();

// Get all users (admin only)
router.get("/", authenticateToken, isAdmin, userController.getAllUsers.bind(userController));

// Get user by ID (admin or self)
router.get("/:id", authenticateToken, userController.getUserById.bind(userController));

// Create a new user account
router.post("/", userController.createUser.bind(userController));

// Update all user details
router.put("/:id", userController.updateUser.bind(userController));

// Update specific user details
router.patch("/:id", userController.patchUser.bind(userController));

// Delete user account
router.delete("/:id", userController.deleteUser.bind(userController));

export default router;
