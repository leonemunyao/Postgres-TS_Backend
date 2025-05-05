import { Express, Request, Response } from "express";
import { UserController } from "../controllers/UserController";

const router = require("express").Router();
const userController = new UserController();

// Create a new user account
router.post("/", userController.createUser.bind(userController));

// Update all user details
router.put("/:id", userController.updateUser.bind(userController));

// Update specific user details
router.patch("/:id", userController.patchUser.bind(userController));

// Delete user account
router.delete("/:id", userController.deleteUser.bind(userController));

export default router;
