 import express from "express";
 import { verifyToken } from "../middleware/verifyToken.js";
 import {addPost,deletePost,getPost,getPosts,updatePost,likePost} from "../controllers/post.controller.js";
 import { commentPost, updateComment, deleteComment } from "../controllers/comment.controller.js";

 const router = express.Router();

 router.get("/",verifyToken,getPosts);
 router.get("/:id",verifyToken,getPost);
 router.post("/",verifyToken,addPost);
 router.put("/:id",verifyToken,updatePost);
 router.delete("/:id",verifyToken,deletePost);
 router.post("/:id/like",verifyToken,likePost);

 
 router.post("/:id/comment",verifyToken,commentPost);
 router.put("/:id/comments/:commentId", verifyToken, updateComment);
 router.delete("/:id/comments/:commentId", verifyToken, deleteComment);

 export default router;