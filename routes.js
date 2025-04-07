import express from "express";
import { userAuth, verifyAdmin, verifyAdminOrOwner } from './middleware/authMiddleware.js';
import {
  createNewPost,
  getAllApprovedPosts,
  getPendingPosts,
  getUserPosts,
  deletePost,
  createNewCommunityPost,
  getCommunityApprovedPosts,
  verifyUserLogin,
  registerNewUser,
  getApprovedUsers,
  getPendingUsers,
  approveUser,
  deleteUser,
  createNewUser,
  fileUpload,
  //getSpecificUser,
  //promoteUser,
  updateUserInfo,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
  getUserCommunities,
  searchUser,
  findUser,
  addComment,
  getComment,
  getCommentByCommentID,
  addCommentToPost,
  getCommentsByPostID,
  updateComment,
  deleteComment,
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  getLastMessage,
  getUserInfo,
  checkIfFriended,
  friendUser,
  unfriendUser,
  getFriendsList,
  getPendingFriendRequests,
  getTest,
  createNewCommunity,
  getSentFriendRequests,
  changeColor,
  likePost,
  unlikePost,
  getPostLikes,
  checkLikedPost
} from "./dbLogic.js";

const router = express.Router();

// Authentication Routes
router.post("/login", verifyUserLogin);
router.post("/register", registerNewUser);
router.patch("/updateUserInfo", updateUserInfo);

// User Management Routes
router.post("/createNewUser", createNewUser);
router.get("/getApprovedUsers", getApprovedUsers);
router.get("/getPendingUsers", getPendingUsers);
router.post("/approveUser", approveUser);
router.post("/changeUserColor", changeColor);
router.delete("/deleteUser", deleteUser);
//router.get("/getSpecificUser", getSpecificUser); // Assuming this function will be implemented similarly to getApprovedUsers
//router.post("/promoteUser", promoteUser);

// Post Routes
router.post("/fileUpload", fileUpload);
router.post("/createNewPost", createNewPost);
router.get("/getAllApprovedPosts", getAllApprovedPosts);
router.get("/getPendingPosts", getPendingPosts);
router.get("/getUserPosts", getUserPosts);
//router.delete("/deletePost", deletePost);
router.delete("/deletePost/:postId", userAuth, verifyAdminOrOwner, deletePost);

// Community Post Routes
router.post("/createNewCommunityPost", createNewCommunityPost);
router.get("/getCommunityApprovedPosts", getCommunityApprovedPosts);

// Community Management Routes
router.post("/createNewCommunity", createNewCommunity);
router.get("/getAllCommunities", getAllCommunities);
router.post("/joinCommunity", joinCommunity);
router.delete("/leaveCommunity", leaveCommunity);
router.get("/getUserCommunities", getUserCommunities);

// User Search Routes
router.get("/searchUser", searchUser);
router.get("/findUser", findUser);

// Comment Routes
router.post("/addComment", addComment);
router.get("/getComment", getComment);
router.get("/getCommentByCommentID", getCommentByCommentID);
router.post("/addCommentToPost", addCommentToPost);
router.get("/getCommentsByPostID", getCommentsByPostID);
router.put("/updateComment", updateComment);
router.delete("/deleteComment", deleteComment);

// Messaging Routes
router.post("/createConversation", createConversation);
router.get("/getConversations", getConversations);
router.post("/sendMessage", sendMessage);
router.get("/getMessages", getMessages);
router.get("/getLastMessage", getLastMessage);

// Friend Routes
router.get("/getUserInfo", getUserInfo);
router.get("/checkIfFriended", checkIfFriended);
router.post("/friendUser", friendUser);
router.delete("/unfriendUser", unfriendUser);
router.get("/getFriendsList", getFriendsList);
router.get("/getSentFriendRequests", getSentFriendRequests);
router.get("/getPendingFriendRequests", getPendingFriendRequests);

// Liking Post Routes
router.post("/likePost", likePost);
router.post("/getPostLikes", getPostLikes);
router.post("/checkLikedPost", checkLikedPost);
router.post("/unlikePost", unlikePost);

// Test Route
router.get("/getTest", getTest);

export default router;