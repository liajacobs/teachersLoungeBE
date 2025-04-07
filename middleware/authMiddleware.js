/*import jwt from "jsonwebtoken";

import connection from '../database.js';

const userAuth = async (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization;

  // Check if the token is present and properly formatted
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized request" });
  }

  const tokenValue = token.split(' ')[1]; // Extract the token part


    // Get email from the token
    const { email } = jwt.verify(tokenValue, process.env.JWT_SECRET);

    // Attach user id for further requests
    connection.query("select * from USER where USER.email=\""+email+"\";", function(error, results){

        // Return error if any
        if(error){
            console.error(error.stack);
            return res.status(500).json({message:"Server error: "+error.stack});
        }

        // Return error if no user is found
        if(results[0]==null){
            return res.status(401).json({message:"No user found with this email"});
        }else{
            req.userEmail = email; 
        }
    }
    );

    // Move forward with request
    next();
};

export {userAuth};*/
import jwt from "jsonwebtoken";
import connection from '../database.js';

const userAuth = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized request" });
  }

  const tokenValue = token.split(' ')[1];

  try {
    const { email, role } = jwt.verify(tokenValue, process.env.JWT_SECRET);

    // Perform the database query to find the user by email in the users table
    connection.query('SELECT * FROM users WHERE email = $1', [email], function (error, results) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: "Server error: " + error.stack });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "No user found with this email" });
      }

      req.userEmail = email;
      req.userRole = role;
      next();
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'Admin') {
    return res.status(403).json({ message: 'Admin role required' });
  }
  next();
};

const verifyAdminOrOwner = (req, res, next) => {
  const postId = req.params.postId;

  // Query to find the post by ID and check the owner
  connection.query('SELECT * FROM posts WHERE id = $1', [postId], function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error: " + error.stack });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    const post = results[0];

    
    if (req.userRole === 'Admin' || post.ownerEmail === req.userEmail) {
      next();
    } else {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }
  });
};
export { userAuth, verifyAdmin, verifyAdminOrOwner };

