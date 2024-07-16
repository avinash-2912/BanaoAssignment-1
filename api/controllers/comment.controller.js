import prisma from "../lib/prisma.js";

export const commentPost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;
    const { content } = req.body;
  
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });
  
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const newComment = await prisma.comment.create({
        data: {
          content,
          postId,
          userId,
        },
      });
  
      res.status(201).json(newComment);
    } catch (err) {
      res.status(500).json({ message: "Failed to comment on post" });
    }
  };

export const updateComment = async (req, res) => {
  const commentId = req.params.commentId;
  const { content } = req.body;
  const userId = req.userId;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found!" });
    }
    if (comment.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this comment!" });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });

    res.status(200).json(updatedComment);
  } catch (err) {
    res.status(500).json({ message: "Failed to update comment" });
  }
};

export const deleteComment = async (req, res) => {
  const postId = req.params.id;
  const commentId = req.params.commentId;
  const userId = req.userId;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found!" });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (comment.userId !== userId && post.authorId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this comment!",
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: "Deleted the comment successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};
