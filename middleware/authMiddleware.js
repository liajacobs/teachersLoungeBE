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
    const { email } = jwt.verify(tokenValue, process.env.JWT_SECRET);

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
      next();
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export { userAuth };

