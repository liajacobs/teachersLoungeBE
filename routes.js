import express from "express";
import { userAuth, verifyAdmin, verifyAdminOrOwner,verifyAdminOrCommentOwner } from './middleware/authMiddleware.js';
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

// Authentication Routes (open)
router.post("/login", verifyUserLogin);
router.post("/register", registerNewUser);

// Protected user routes
router.patch("/updateUserInfo", userAuth, updateUserInfo);

// User Management Routes
router.post("/createNewUser", userAuth, verifyAdmin, createNewUser);
router.get("/getApprovedUsers", userAuth, verifyAdmin, getApprovedUsers);
router.get("/getPendingUsers", userAuth, verifyAdmin, getPendingUsers);
router.post("/approveUser", userAuth, verifyAdmin, approveUser);
router.post("/changeUserColor", userAuth, changeColor);
router.delete("/deleteUser", userAuth, verifyAdminOrOwner, deleteUser);
// router.get("/getSpecificUser", ...);
// router.post("/promoteUser", ...);

// Post Routes
router.post("/fileUpload", userAuth, fileUpload);
router.post("/createNewPost", userAuth, createNewPost);
router.get("/getAllApprovedPosts", userAuth, getAllApprovedPosts);
router.get("/getPendingPosts", userAuth, verifyAdmin, getPendingPosts);
router.get("/getUserPosts", userAuth, getUserPosts);
router.delete("/deletePost/:postId", userAuth, verifyAdminOrOwner, deletePost);

// Community Post Routes
router.post("/createNewCommunityPost", userAuth, createNewCommunityPost);
router.get("/getCommunityApprovedPosts", userAuth, getCommunityApprovedPosts);

// Community Management Routes
router.post("/createNewCommunity", userAuth, createNewCommunity);
router.get("/getAllCommunities", userAuth, getAllCommunities);
router.post("/joinCommunity", userAuth, joinCommunity);
router.delete("/leaveCommunity", userAuth, leaveCommunity);
router.get("/getUserCommunities", userAuth, getUserCommunities);

// User Search Routes
router.get("/searchUser", userAuth, searchUser);
router.get("/findUser", userAuth, findUser);

// Comment Routes
router.post("/addComment", userAuth, addComment);
router.get("/getComment", userAuth, getComment);
router.get("/getCommentByCommentID", userAuth, getCommentByCommentID);
router.post("/addCommentToPost", userAuth, addCommentToPost);
router.get("/getComments/:postId", userAuth, getCommentsByPostID);
router.put("/updateComment", userAuth, updateComment);
router.delete("/deleteComment/:commentId", userAuth, verifyAdminOrCommentOwner, deleteComment);


// Messaging Routes
router.post("/createConversation", userAuth, createConversation);
router.get("/getConversations", userAuth, getConversations);
router.post("/sendMessage", userAuth, sendMessage);
router.get("/getMessages", userAuth, getMessages);
router.get("/getLastMessage", userAuth, getLastMessage);

// Friend Routes
router.get("/getUserInfo", userAuth, getUserInfo);
router.get("/checkIfFriended", userAuth, checkIfFriended);
router.post("/friendUser", userAuth, friendUser);
router.delete("/unfriendUser", userAuth, unfriendUser);
router.get("/getFriendsList", userAuth, getFriendsList);
router.get("/getSentFriendRequests", userAuth, getSentFriendRequests);
router.get("/getPendingFriendRequests", userAuth, getPendingFriendRequests);

// Liking Post Routes
router.post("/likePost", userAuth, likePost);
router.post("/getPostLikes", getPostLikes);
router.post("/checkLikedPost", userAuth, checkLikedPost);
router.post("/unlikePost", userAuth, unlikePost);

// Test Route (auth optional depending on purpose)
router.get("/getTest", userAuth, getTest);

export default router;
