import { decrypt, encrypt } from "../lib/encryption.js";
import prisma from "../lib/prisma.js";

export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            username: true,
          },
        },
        likes: true,
        comments: true,
      },
    });

    posts.forEach((post) => {
      post.content = decrypt(post.content); 
      post.images = post.images.map(image => decrypt(image));
    });

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        likes: true,
        comments: true,
      },
    });
    
    const encContent = post.content;
    post.content = decrypt(encContent)

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

export const addPost = async (req, res) => {
  const { content, images } = req.body;
  const encImages = [];
  images.forEach((image,id) =>{
     encImages.push(encrypt(image))
  })
  const userId = req.userId;
  try {
    const newPost = await prisma.post.create({
      data: {
        content:encrypt(content),
        images:encImages,
        authorId: userId,
      },
    });
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: "failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const userId = req.userId;
  const { content, images } = req.body;
  try {
    const postToUpdate = await prisma.post.findUnique({
      where: { id },
    });
    if (!postToUpdate) {
      return res.status(404).json({ message: "Post not found!" });
    }
    if (postToUpdate.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not Authorized to update this post!" });
    }
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content,
        images,
      },
    });
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
    const id = req.params.id;
    const userId = req.userId;
    try{
        const post = await prisma.post.findUnique({
            where:{id}
        })
        if(!post){
            return res.status(404).json({message:"post not found"});
        }
        if(userId !== post.authorId){
            return res.status(403).json({message:"You are not Authorized to delete this post"});
        }

        await prisma.post.delete({
            where:{id}
        }) 
        res.status(200).json({message:"Deleted the post successfully"})

    }catch(err){
        res.status(500).json({message:"failed to delete post !"})
    }
};

export const likePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.userId;
  
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });
      //console.log(post)
  
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const existingLike = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: postId,
            userId: userId,
          },
        },
      });

      //console.log(existingLike)
  
      if (existingLike) {
        await prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        });
        return res.status(200).json({ message: "Like removed" });
      } else {
        const newLike = await prisma.like.create({
          data: {
            postId: postId,
            userId: userId,
          },
        });
        return res.status(201).json(newLike);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to toggle like on post" });
    }
  };
  

  
  