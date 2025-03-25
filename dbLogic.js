import pool from "./database.js";
import bcrypt from "bcrypt";
import { generateToken } from "./utils/tokenGenerator.js";

//Functions to connect to DB
const connectDB = (req, res, next) => {
  connection.connect(function (err) {
    if (err) {
      console.error("Database connection failed: " + err.stack);
    }
    console.log("Connected to database.");
  });
};
const disconnectDB = (req, res, next) => {
  connection.end(function (err) {
    if (err) {
      console.error("Failed to disconnect from db" + err.stack);
    }
  });
  console.log("Disconnected from database");
};

//Functions for logging in and registering

// Logs in the user to the app
/*const verifyUserLogin = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const sql = 'SELECT * FROM USERS WHERE email = $1';
    const results = await client.query(sql, [req.body.username]);

    if (results.rows.length > 0) {
      const user = results.rows[0];
      console.log(user);

      const match = await bcrypt.compare(req.body.password, user.password);

      if (!match) {
        return res.status(400).json({ message: "Incorrect password" });
      }

      const token = generateToken(req.body.username);
      return res.status(200).json({
        message: "User logged in successfully",
        user: {
          Email: user.email,
          FirstName: user.firstname,
          LastName: user.lastname,
          SchoolID: user.schoolid,
          Role: user.role,
          color: user.color
        },
        token: token,
      });
    } else {
      return res.status(400).json({ message: "User doesn't exist" });
    }
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error: " + error.stack });
  } finally {
    client.release();
  }
};*/
const verifyUserLogin = async (req, res, next) => {
  const client = await pool.connect();

  try {
    // Updated SQL query to join USERS and SCHOOL tables
    const sql = `
      SELECT 
        U.email, 
        U.firstname, 
        U.lastname, 
        U.password, 
        U.color,
        S.schoolname AS schoolname, 
        U.role 
      FROM USERS AS U
      INNER JOIN SCHOOL AS S ON U.schoolid = S.schoolid
      WHERE U.email = $1
    `;

    const results = await client.query(sql, [req.body.username]);

    if (results.rows.length > 0) {
      const user = results.rows[0];
      console.log(user);

      // Verify password using bcrypt
      const match = await bcrypt.compare(req.body.password, user.password);

      if (!match) {
        return res.status(400).json({ message: "Incorrect password" });
      }

      // Generate token and return response with schoolname
      const token = generateToken(req.body.username);
      return res.status(200).json({
        message: "User logged in successfully",
        user: {
          Email: user.email,
          FirstName: user.firstname,
          LastName: user.lastname,
          SchoolName: user.schoolname, // Use schoolname instead of schoolid
          Role: user.role,
          color: user.color,
        },
        token: token,
      });
    } else {
      return res.status(400).json({ message: "User doesn't exist" });
    }
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error: " + error.stack });
  } finally {
    client.release();
  }
};


// Registers a new user onto the app
const registerNewUser = async (req, res, next) => {
  console.log(req.body);

  try {
    // Query to check if the user already exists
    const checkUserQuery = "SELECT * FROM USERS WHERE email = $1";
    const checkUserResult = await pool.query(checkUserQuery, [req.body.username]);

    // User already exists
    if (checkUserResult.rows.length > 0) {
      const user = checkUserResult.rows[0];
      return res.status(400).json({
        message: "This username is already taken",
        data: {
          Email: user.email,
          FirstName: user.firstname,
          LastName: user.lastname,
          SchoolID: user.schoolid,
          Role: user.role,
        },
      });
    }

    // Hash user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Generate JWT for the user
    const token = generateToken(req.body.username);

    // Insert new user into the database
    const insertUserQuery =
      "INSERT INTO USERS (Email, FirstName, LastName, Password, SchoolID, Role) VALUES ($1, $2, $3, $4, $5, $6)";
    await pool.query(insertUserQuery, [
      req.body.username,
      req.body.firstName,
      req.body.lastName,
      hashedPassword,
      1, // Assuming 1 is a placeholder for SchoolID
      req.body.role
    ]);

    // Respond with success message and user data
    return res.status(200).json({
      Email: req.body.username,
      FirstName: req.body.firstName,
      LastName: req.body.lastName,
      SchoolID: 1,
      Role: req.body.role,
      token: token,
    });

  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error: " + error.stack });
  }
};

//Functions dealing with users

//Required fields in req.body: email, fname, lname, schoolId
const createNewUser = async (req, res, next) => {
  const sql =
    "INSERT INTO USERS (Email, FirstName, LastName, SchoolID) VALUES ($1, $2, $3, $4)";

  try {
    // Execute the query with pool.query
    const results = await pool.query(sql, [
      req.body.email,
      req.body.fname,
      req.body.lname,
      req.body.schoolId
    ]);

    // Send a success response with the query results
    return res.status(200).json({ data: results });

  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};
// const getSpecificUser = (req, res, next) => {
//   //TODO- this will be the same as getApprovedUsers but add a WHERE for the email
// };

const promoteUser = (req, res, next) => {
  //This function does not have an endpoint, at the time of writing, have not determined a system for making a user and Admin
  var sql =
    "UPDATE USERS SET Role =" +
    connection.escape("Admin") +
    " WHERE (USERS.Email= " +
    connection.escape(req.body.email) +
    ")";
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const changeColor = async (req, res, next) => {
  console.log("change color hit");
  const sql =
    `UPDATE USERS 
    SET color = $1
    WHERE USERS.email= $2`;
  try {
    const results = await pool.query(sql, [
      req.body.color,
      req.body.email
    ]);
    return res.status(200).json({ data: results });

  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};


const approveUser = async (req, res, next) => {
  const sql =
    `UPDATE USERS 
    SET Role = 'Approved'
    WHERE USERS.Email= $1`;
  try {
    const results = await pool.query(sql, [
      req.body.email
    ]);
    return res.status(200).json({ data: results });

  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};


const updateUserInfo = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { email, newEmail, firstname, lastname, schoolName } = req.body;

    console.log("Received request to update user info for email:", email);

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const trimmedEmail = email.trim();
    const trimmedNewEmail = newEmail ? newEmail.trim() : null;

    // Query to find the user
    const checkUserQuery = "SELECT * FROM USERS WHERE email = $1";
    const userResult = await client.query(checkUserQuery, [trimmedEmail]);

    if (userResult.rows.length === 0) {
      console.error("User not found for email:", email);
      return res.status(404).json({ message: `User not found for email: ${email}` });
    }

    await client.query("BEGIN");

    // Handle school update logic
    if (schoolName) {
      const checkSchoolQuery = `
        SELECT schoolid FROM SCHOOL WHERE LOWER(schoolname) = LOWER($1)
      `;
      const schoolResult = await client.query(checkSchoolQuery, [schoolName]);

      let schoolId;
      if (schoolResult.rows.length > 0) {
        // School exists
        schoolId = schoolResult.rows[0].schoolid;
      } else {
        // Create a new school entry with auto-generated schoolid
        const insertSchoolQuery = `
          INSERT INTO SCHOOL (schoolid, schoolname)
          VALUES ((SELECT COALESCE(MAX(schoolid), 0) + 1 FROM SCHOOL), $1)
          RETURNING schoolid
        `;
        const newSchoolResult = await client.query(insertSchoolQuery, [schoolName]);
        schoolId = newSchoolResult.rows[0].schoolid;
      }

      const updateSchoolQuery = "UPDATE USERS SET schoolid = $1 WHERE email = $2";
      await client.query(updateSchoolQuery, [schoolId, trimmedEmail]);
      console.log("User's school updated successfully.");
    }

    // Update user table fields
    let updateQuery = "UPDATE USERS SET";
    const updateValues = [];
    let index = 1;

    if (trimmedNewEmail) {
      updateQuery += ` email = $${index},`;
      updateValues.push(trimmedNewEmail);
      index++;
    }
    if (firstname) {
      updateQuery += ` firstname = $${index},`;
      updateValues.push(firstname.trim());
      index++;
    }
    if (lastname) {
      updateQuery += ` lastname = $${index},`;
      updateValues.push(lastname.trim());
      index++;
    }

    if (updateValues.length > 0) {
      updateQuery = updateQuery.slice(0, -1); // Remove trailing comma
      updateQuery += ` WHERE email = $${index}`;
      updateValues.push(trimmedEmail);

      await client.query(updateQuery, updateValues);
      console.log("User table updated successfully.");
    }

    // Update other tables where email is referenced
    if (trimmedNewEmail) {
      const tablesToUpdate = [
        { table: "conversation_members", column: "email" },
        { table: "community_members", column: "email" },
        { table: "friends", columns: ["friender", "friendee"] },
        { table: "message", column: "sender" },
        { table: "post", column: "email" },
        { table: "post_likes", column: "email" },
      ];

      for (const table of tablesToUpdate) {
        if (Array.isArray(table.columns)) {
          for (const column of table.columns) {
            const updateTableQuery = `UPDATE ${table.table} SET ${column} = $1 WHERE ${column} = $2`;
            await client.query(updateTableQuery, [trimmedNewEmail, trimmedEmail]);
          }
        } else {
          const updateTableQuery = `UPDATE ${table.table} SET ${table.column} = $1 WHERE ${table.column} = $2`;
          await client.query(updateTableQuery, [trimmedNewEmail, trimmedEmail]);
        }
      }

      console.log("All referenced tables updated successfully.");
    }

    await client.query("COMMIT");

    return res.status(200).json({ message: "User information updated successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating user info:", error.stack);
    return res.status(500).json({ message: "Server error." });
  } finally {
    client.release();
  }
};






const deleteUser = (req, res, next) => {
  var sql =
    "DELETE FROM USERS where USERS.Email=" + connection.escape(req.body.email);
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const getApprovedUsers = (req, res, next) => {
  console.log('getApprovedUsers hit');
  pool.query(
    "select * from USERS where (USERS.Role= " +
    connection.escape("Approved") +
    ") OR (USERS.Role=" +
    connection.escape("Admin") +
    ")",
    function (error, results) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

const getPendingUsers = (req, res, next) => {
  console.log('getPendingUsers hit');
  pool.query(
    "select * from USERS where USERS.Role= " + connection.escape("Guest"),
    function (error, results) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

//Functions dealing with posts

// Approve a post
const approvePost = async (req, res, next) => {
  const sql = "UPDATE POST SET Approved = $1 WHERE PostID = $2";
  const values = [1, req.body.id];

  try {
    await pool.query(sql, values);
    return res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};

// Delete a post
const deletePost = async (req, res, next) => {
  console.log('delete posts hit');
  console.log(req.body.id);
  try {
    // Delete likes associated with the post
    const deleteLikesSql = "DELETE FROM POST_LIKES WHERE postid = $1";
    await pool.query(deleteLikesSql, [req.body.id]);

    // Delete comments associated with the post
    const deleteCommentsSql = "DELETE FROM COMMENT WHERE postid = $1";
    await pool.query(deleteCommentsSql, [req.body.id]);

    // Delete the post itself
    const deletePostSql = "DELETE FROM POST WHERE postid = $1";
    await pool.query(deletePostSql, [req.body.id]);

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};

// Get pending posts
const getPendingPosts = async (req, res, next) => {
  const sql = "SELECT * FROM POST WHERE approved = $1";
  const values = [0]; // 0 for pending posts

  try {
    const results = await pool.query(sql, values);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};

// Get posts by user
const getUserPosts = async (req, res, next) => {
  const sql = "SELECT * FROM POST WHERE email = $1";
  const values = [req.body.email];

  try {
    const results = await pool.query(sql, values);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};

// Get all approved posts
// const getAllApprovedPosts = async (req, res, next) => {
//   console.log('getAllApprovedPosts hit')
//   try {
//     const sql = "SELECT * FROM POST WHERE approved = $1";
//     const results = await pool.query(sql, [1]); // 1 for approved posts

//     return res.status(200).json({ data: results.rows });
//   } catch (error) {
//     console.error(error.stack);
//     return res.status(500).json({ message: "Server error, try again" });
//   }
// };
// Get all approved posts with likes and comments count
const getAllApprovedPosts = async (req, res, next) => {
  console.log('getAllApprovedPosts hit');
  try {
    const sql = `
      SELECT p.*, 
             c.communityname, 
             COALESCE(COUNT(pl.postid), 0) AS likescount, 
             COALESCE(cmt.commentscount, 0) AS commentscount
      FROM POST p
      LEFT JOIN COMMUNITY c ON p.communityid = c.communityid
      LEFT JOIN POST_LIKES pl ON p.postid = pl.postid
      LEFT JOIN (
        SELECT postid, COUNT(*) AS commentscount
        FROM COMMENT
        GROUP BY postid
      ) cmt ON p.postid = cmt.postid
      WHERE p.approved = $1
      GROUP BY p.postid, c.communityname, cmt.commentscount
    `;

    const results = await pool.query(sql, [1]); // 1 for approved posts

    if (results.rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    console.log(results.rows)

    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

const fileUpload = async (req, res, next) => {
  console.log('File upload hit');
  console.log(req.body)

  try {
    const result = await pool.query(sql, values);
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};

const getAllApprovedPostsByUser = async (req, res, next) => {
  console.log('getAllApprovedPostsByUser hit');

  const { username } = req.params; // This grabs the username from the URL parameter

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const sql = `
      SELECT p.*, 
             c.communityname, 
             COALESCE(COUNT(pl.postid), 0) AS likescount, 
             COALESCE(cmt.commentscount, 0) AS commentscount
      FROM POST p
      LEFT JOIN COMMUNITY c ON p.communityid = c.communityid
      LEFT JOIN POST_LIKES pl ON p.postid = pl.postid
      LEFT JOIN (
        SELECT postid, COUNT(*) AS commentscount
        FROM COMMENT
        GROUP BY postid
      ) cmt ON p.postid = cmt.postid
      WHERE p.approved = $1 
        AND p.email = $2  -- Filter posts based on the username (which is the email)
      GROUP BY p.postid, c.communityname, cmt.commentscount
    `;

    const results = await pool.query(sql, [1, username]); // Fetch posts by username (email)

    if (results.rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    console.log(results.rows);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};


// Create a new post
const createNewPost = async (req, res, next) => {
  console.log('create new post hit');
  console.log(req.body);

  // Validate that communityid is provided if the post is for a community
  if (req.body.isCommunityPost && !req.body.communityid) {
    return res.status(400).json({ message: 'Community ID is required for community posts.' });
  }

  const sql = `
    INSERT INTO POST (content, email, fileurl, filedisplayname, filetype, approved, communityid)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;

  const values = [
    req.body.content,
    req.body.email,
    req.body.fileurl,
    req.body.filedisplayname,
    req.body.filetype,
    req.body.approved || 1, // Default to approved
    req.body.communityid// Assign communityid if provided
  ];

  try {
    const result = await pool.query(sql, values);
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};

// Add a like to a post
const likePost = async (req, res, next) => {
  const sql = "INSERT INTO POST_LIKES (PostID, Email) VALUES ($1, $2)";
  const values = [req.body.postId, req.body.userEmail];

  try {
    await pool.query(sql, values);
    return res.status(200).json({ message: "Successfully liked the post!" });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

const unlikePost = async (req, res, next) => {
  console.log('unlikePost hit');
  const sql = "DELETE FROM POST_LIKES WHERE PostID = $1 AND Email = $2 RETURNING *";
  const values = [req.body.postId, req.body.userEmail];

  try {
    const results = await pool.query(sql, values);

    if (results.rowCount === 0) {
      return res.status(404).json({ message: "You have not liked this post yet!" });
    }

    return res.status(200).json({ message: "Post unliked successfully." });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again." });
  }
};

// Get the number of likes for a post
const getPostLikes = async (req, res, next) => {
  const sql = "SELECT COUNT(*) as likeCount FROM POST_LIKES WHERE POSTID = $1";
  const values = [req.body.postID];

  try {
    const results = await pool.query(sql, values);
    return res.status(200).json({ likeCount: results.rows[0].likecount });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

// Check if user already liked the post
const checkLikedPost = async (req, res, next) => {
  console.log("checkLikedPost hit");
  const sql =
    "SELECT EXISTS(SELECT 1 FROM POST_LIKES WHERE PostID=$1 AND Email=$2) AS exists";
  const values = [req.body.postId, req.body.userEmail];

  console.log("Received request with:", values);

  try {
    const results = await pool.query(sql, values);
    console.log("Query executed, results:", results.rows);

    if (results.rows[0].exists) {
      console.log("Post is already liked! Returning 409.");
      return res
        .status(409)
        .json({ message: "You've already liked this post!" });
    } else {
      console.log("Post is not liked yet! Returning 200.");
      return res.status(200).json({ message: "Successfully liked the post!" });
    }
  } catch (error) {
    console.error("Database query error:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};


const createNewCommunity = (req, res, next) => {
  console.log('create new community hit');
  const sql = "SELECT * FROM COMMUNITY WHERE communityname = $1";
  console.log(req.body);
  const values = [req.body.communityName];

  pool.query(sql, values, (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }
    if (results.rows.length === 0) {
      const insertSql = "INSERT INTO COMMUNITY(communityname) VALUES ($1)";
      pool.query(insertSql, values, (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Server error, try again" });
        }
        return res.status(201).json({ message: "Community created successfully" });
      });
    } else {
      return res.status(500).json({ message: "Community already exists!" });
    }
  });
};

// Gets all communities
const getAllCommunities = (req, res, next) => {
  console.log('getAllCommunities hit');
  const sql = "SELECT * FROM COMMUNITY";

  // Run insert query
  pool.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results.rows });
  });
};

// Joins a specified user to the specified community
const joinCommunity = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const sql = `
      INSERT INTO COMMUNITY_MEMBERS (communityid, email)
      VALUES ($1, $2);
    `;
    const values = [req.body.communityID, req.body.userEmail];
    await client.query(sql, values);

    return res.status(201).json({ message: "User joined community successfully" });
  } catch (error) {
    if (error.code === "23505") { // Constraint violation
      return res.status(400).json({ message: "User is already a member of this community" });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error, try again" });
  } finally {
    client.release();
  }
};

// Leaves a specified user from the specified community
const leaveCommunity = (req, res, next) => {
  const { communityID, userEmail } = req.query;
  console.log(`Attempting to leave community: ${communityID}, User: ${userEmail}`);

  const sql = `
      DELETE FROM COMMUNITY_MEMBERS
      WHERE CommunityID = $1
      AND Email = $2`;

  pool.query(sql, [communityID, userEmail], (error, results) => {
    if (error) {
      console.error('Error executing query:', error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    if (results.rowCount > 0) {
      console.log('User removed successfully');
      return res.status(200).json({ message: "User removed from community successfully" });
    } else {
      console.log('No rows affected');
      return res.status(404).json({ message: "User not found in community" });
    }
  });
};

// Returns the communties a user is in
const getUserCommunities = (req, res, next) => {
  console.log('getUserCommunities hit');
  const email = req.query.email;
  const sql =
    "SELECT c.communityid, c.communityname FROM COMMUNITY c JOIN COMMUNITY_MEMBERS cm ON c.communityid = cm.communityid WHERE cm.email = $1";

  pool.query(sql, [email], function (error, results) {
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }
    console.log(results.rows)
    return res.status(200).json({ data: results.rows });
  });
};

const getCommunityApprovedPosts = async (req, res, next) => {
  console.log('getCommunityApprovedPosts hit');
  const { communityID } = req.query;

  const sql = `
    SELECT p.*, 
           c.communityname, 
           COALESCE(COUNT(pl.postid), 0) AS likescount, 
           COALESCE(cmt.commentscount, 0) AS commentscount
    FROM POST p
    LEFT JOIN COMMUNITY c ON p.communityid = c.communityid
    LEFT JOIN POST_LIKES pl ON p.postid = pl.postid
    LEFT JOIN (
      SELECT postid, COUNT(*) AS commentscount
      FROM COMMENT
      GROUP BY postid
    ) cmt ON p.postid = cmt.postid
    WHERE p.communityid = $1 AND p.approved = 1
    GROUP BY p.postid, c.communityname, cmt.commentscount
  `;

  const values = [communityID];

  try {
    const result = await pool.query(sql, values);

    if (result.rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    console.log(result.rows);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching community posts:', error.stack);
    return res.status(500).json({ message: error.message });
  }
};


const createNewCommunityPost = async (req, res, next) => {
  console.log('createNewCommunityPost hit');
  console.log(req.body);

  const sql = `
    INSERT INTO POST (content, email, fileurl, filedisplayname, filetype, communityid)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`;
  const values = [
    req.body.content,
    req.body.email,
    req.body.fileUrl || null, // Handle optional file URL
    req.body.fileDisplayName || "None",
    req.body.fileType || "None",
    req.body.communityId // Ensure this is passed correctly
  ];

  try {
    const result = await pool.query(sql, values);
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating community post:', error.stack);
    return res.status(500).json({ message: 'Failed to create community post.', error: error.message });
  }
};

const getCommunityName = async (req, res) => {
  const { communityId } = req.query;

  if (!communityId) {
    return res.status(400).json({ error: "communityId is required" });
  }

  try {
    const [result] = await db.execute(
      "SELECT communityname FROM COMMUNITY WHERE communityid = ?",
      [communityId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Community not found" });
    }

    res.json({ communityName: result[0].communityname });
  } catch (error) {
    console.error("Error fetching community name:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Searches for a user
const searchUser = async (req, res, next) => {
  const searchQuery = req.query.searchQuery;
  console.log(searchQuery);
  console.log('searchUser hit');

  if (searchQuery !== "") {
    const sql = `SELECT * FROM USERS 
                 WHERE FirstName ILIKE $1 
                 OR LastName ILIKE $1`;

    try {
      const client = await pool.connect();

      const result = await client.query(sql, [`%${searchQuery}%`]);

      console.log(result.rows);

      client.release();

      return res.status(200).json({ data: result.rows });
    } catch (error) {
      console.error("Error executing search query:", error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
  } else {
    return res.status(400).json({ message: "Search query cannot be empty" });
  }
};

const findUser = async (req, res, next) => {
  console.log('findUser hit');

  console.log(req.query);
  const sql = `SELECT * FROM USERS 
                 WHERE email = $1`;

  try {
    const client = await pool.connect();

    const result = await client.query(sql, [req.query.email]);

    console.log(result.rows);

    client.release();

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing search query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }

};

const addComment = async (req, res, next) => {
  console.log('addComment hit');

  // SQL query to insert a new comment
  const sql = `
    INSERT INTO COMMENT (content, email, time, postid)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
  const values = [
    req.body.content,
    req.body.email,
    req.body.time,
    req.body.postid
  ];

  try {
    // Execute the query using the pool
    const result = await pool.query(sql, values);
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error adding comment:', error.stack);
    return res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

const getComment = async (req, res, next) => {
  console.log('getComment hit');
  const sql = "SELECT * FROM COMMENT WHERE email = $1 AND content = $2";
  const values = [req.query.email, req.query.content];

  try {
    const results = await pool.query(sql, values);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error('Error fetching comment:', error.stack);
    return res.status(500).json({ message: 'Server error, try again' });
  }
};

const getCommentByCommentID = async (req, res, next) => {
  console.log('getCommentByCommentID hit');
  const sql = "SELECT * FROM COMMENT WHERE id = $1";
  const values = [req.body.commentId];

  try {
    const results = await pool.query(sql, values);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error('Error fetching comment by ID:', error.stack);
    return res.status(500).json({ message: 'Server error, try again' });
  }
};

const getCommentsByPostID = async (req, res, next) => {

  const postId = Number(req.query.postId);

  if (isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid postId' });
  }
  const sql = `
    SELECT 
        *
    FROM 
        comment
    WHERE 
        postid = $1;
  `;

  try {
    const results = await pool.query(sql, [postId]);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error('Error fetching comments by post ID:', error.stack);
    return res.status(500).json({ message: 'Server error, try again' });
  }
};

const updateComment = async (req, res, next) => {
  console.log('updateComment hit');
  const sql = "UPDATE COMMENT SET Content = $1 WHERE CommentID = $2";
  const values = [req.body.content, req.body.commentId];

  try {
    await pool.query(sql, values);
    return res.status(200).json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error.stack);
    return res.status(500).json({ message: 'Server error, try again' });
  }
};

const deleteComment = async (req, res, next) => {
  console.log('deleteComment hit');
  const sql = "DELETE FROM COMMENT WHERE CommentID = $1";
  const values = [req.body.commentId];

  try {
    await pool.query(sql, values);
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error.stack);
    return res.status(500).json({ message: 'Server error, try again' });
  }
};

// Creates a new conversation
const createConversation = async (req, res, next) => {
  // Get sender and receiver email
  const senderEmail = req.body.senderEmail;
  const receiverEmail = req.body.receiverEmail;

  try {
    // Check if conversation already exists
    const checkConversationSql = `SELECT *
                                  FROM CONVERSATION_MEMBERS cm1
                                  JOIN CONVERSATION_MEMBERS cm2 ON cm1.ConversationID = cm2.ConversationID
                                  WHERE cm1.Email = $1 AND cm2.Email = $2;`;

    const existingConversation = await pool.query(checkConversationSql, [senderEmail, receiverEmail]);

    if (existingConversation.rows.length > 0) {
      return res.status(400).json({ message: "Conversation already exists" });
    }

    // Create new conversation
    const createConversationSql = `INSERT INTO CONVERSATION(Title) 
                                   VALUES ('Default Conversation') RETURNING ConversationID;`;

    const newConversation = await pool.query(createConversationSql);
    const conversationId = newConversation.rows[0].conversationid;

    // Insert 1st member of conversation
    const addSenderSql = `INSERT INTO CONVERSATION_MEMBERS(ConversationID, Email) 
                          VALUES ($1, $2);`;
    await pool.query(addSenderSql, [conversationId, senderEmail]);

    // Insert 2nd member of conversation
    const addReceiverSql = `INSERT INTO CONVERSATION_MEMBERS(ConversationID, Email) 
                            VALUES ($1, $2);`;
    await pool.query(addReceiverSql, [conversationId, receiverEmail]);

    // Success response
    return res.status(200).json({ message: "Conversation created successfully" });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ message: "Server error, couldn't create conversation" });
  }
};




// Gets conversations for a user
const getConversations = async (req, res, next) => {
  console.log('getConversations hit');
  const userEmail = req.query.userEmail;

  const sql = `
    SELECT c.conversationid, string_agg(cm.email, ',') AS members
    FROM conversation AS c
    LEFT JOIN conversation_members AS cm ON c.conversationid = cm.conversationid
    WHERE c.conversationid IN (
      SELECT conversationid
      FROM conversation_members
      WHERE email = $1
    )
    GROUP BY c.conversationid;
  `;

  const client = await pool.connect();

  try {
    const results = await client.query(sql, [userEmail]);

    if (!results.rows.length) {
      return res.status(404).json({ message: "No conversations found" });
    }

    let conversations = results.rows.map(row => {
      let members = row.members.split(",");
      let title = members.find(email => email !== userEmail)?.split("@")[0];

      return {
        conversationId: row.conversationid,
        members,
        title
      };
    });

    return res.status(200).json({ data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error.stack);
    return res.status(500).json({ message: "Server error, please try again later" });
  } finally {
    client.release();
  }
};

// Sends a message
const sendMessage = async (req, res, next) => {
  const { message, conversationId, senderEmail } = req.body; // Changed conversation_Id to conversationId

  // SQL query using parameterized placeholders
  const sql = `INSERT INTO MESSAGE(Content, Conversation_ID, Sender)
               VALUES ($1, $2, $3)`;

  try {
    // Using pool.query to run the SQL command with the parameters
    const result = await pool.query(sql, [message, conversationId, senderEmail]);

    // If the query was successful, send a success response
    return res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    // Log any error that occurs and send a 500 error response
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};



// Gets messages for a conversation
// Gets messages for a conversation
const getMessages = async (req, res, next) => {
  console.log('getMessages hit');
  const conversationId = Number(req.query.conversationId); // Ensure this is a number

  // Use the correct column name
  const sql = `SELECT * FROM MESSAGE WHERE conversation_id = $1;`;

  try {
    // Pass parameters as an array
    const result = await pool.query(sql, [conversationId]);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};


// Gets the last message in a conversation
const getLastMessage = async (req, res, next) => {
  const conversationId = Number(req.query.conversationId);

  // Use a parameterized query
  const sql = `SELECT * FROM MESSAGE
              WHERE Conversation_ID = $1
              ORDER BY Message_ID DESC
              LIMIT 1;`;

  try {
    // Pass parameters as an array
    const result = await pool.query(sql, [conversationId]);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

const getUserInfo = async (req, res, next) => {
  console.log('getUserInfo hit');
  const userEmail = req.query.userEmail;

  // Updated SQL query with JOIN to include the schoolname
  const sql = `
    SELECT 
      U.email, 
      U.firstname, 
      U.lastname, 
      S.schoolname, 
      U.role 
    FROM USERS AS U
    INNER JOIN SCHOOL AS S ON U.schoolid = S.schoolid
    WHERE U.email = $1;
  `;

  try {
    const client = await pool.connect();

    // Execute the query
    const result = await client.query(sql, [userEmail]);

    client.release();

    // Return the results
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing user info query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};


// Check if one user friended another, requires both ways to be friends
const checkIfFriended = async (req, res, next) => {
  console.log('check if friended hit');
  const frienderEmail = req.query.frienderEmail;
  const friendeeEmail = req.query.friendeeEmail;

  const sql = `SELECT * FROM FRIENDS WHERE Friendee = $1 AND Friender = $2`;

  try {
    const client = await pool.connect();

    const result = await client.query(sql, [friendeeEmail, frienderEmail]);

    client.release();

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing checkIfFriended query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

// Friends a user, requires both to friend each other to be friends
const friendUser = async (req, res, next) => {
  console.log('friend user hit');
  const frienderEmail = req.body.frienderEmail;
  const friendeeEmail = req.body.friendeeEmail;

  const sql = `INSERT INTO FRIENDS (friendee, friender) VALUES ($1, $2)`;

  try {
    const client = await pool.connect();

    await client.query(sql, [friendeeEmail, frienderEmail]);

    client.release();

    return res.status(201).json({ message: "User friended successfully" });
  } catch (error) {
    console.error("Error executing friendUser query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

const unfriendUser = async (req, res, next) => {
  console.log('unfriendUser hit');
  console.log(req.query.frienderEmail);
  console.log(req.query.friendeeEmail);
  const frienderEmail = req.query.frienderEmail;
  const friendeeEmail = req.query.friendeeEmail;

  const sql = `
    DELETE FROM FRIENDS
    WHERE friendee = $1 AND friender = $2;
  `;

  try {
    const client = await pool.connect();

    const result = await client.query(sql, [friendeeEmail, frienderEmail]);

    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    return res.status(200).json({ message: "User unfriended successfully" });
  } catch (error) {
    console.error("Error unfriending user:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

const getFriendsList = async (req, res, next) => {
  console.log('getFriends hit');
  const userEmail = req.query.userEmail;
  console.log(req.query.userEmail);

  const sql = `SELECT U.email, U.firstname, U.lastname, U.schoolid, U.role
               FROM USERS AS U JOIN 
                  (SELECT friendee AS FriendEmail FROM FRIENDS
                   WHERE friender = $1
                   INTERSECT 
                   SELECT friender AS FriendEmail FROM FRIENDS
                   WHERE friendee = $1) AS FriendsTable
               ON FriendsTable.FriendEmail = U.email;`;

  try {
    const client = await pool.connect();

    const result = await client.query(sql, [userEmail]);

    client.release();

    console.log(result.rows);
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error retrieving friends list:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};


const getSentFriendRequests = async (req, res, next) => {
  console.log('getFriendRequests hit -------------');
  const userEmail = req.query.userEmail;
  console.log(req.query.userEmail);

  const sql = `
    SELECT U.email, U.firstname, U.lastname, U.schoolid, U.role
    FROM USERS AS U
    JOIN (
        SELECT friendee AS FriendEmail 
        FROM FRIENDS AS F1
        WHERE F1.friender = $1
          AND NOT EXISTS (
              SELECT 1 
              FROM FRIENDS AS F2
              WHERE F2.friendee = $1
                AND F2.friender = F1.friendee
          )
    ) AS FriendsTable
    ON FriendsTable.FriendEmail = U.email;
`;


  try {
    const client = await pool.connect();

    const result = await client.query(sql, [userEmail]);

    client.release();

    console.log(result.rows);
    console.log(' ------END-------');
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error retrieving friends list:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};


const getPendingFriendRequests = async (req, res, next) => {
  console.log('getPendingRequests hit -------------');
  const userEmail = req.query.userEmail;
  console.log(req.query.userEmail);

  const sql = `
    SELECT U.email, U.firstname, U.lastname, U.schoolid, U.role
    FROM USERS AS U
    JOIN (
        SELECT friender AS FriendEmail 
        FROM FRIENDS AS F1
        WHERE F1.friendee = $1
          AND NOT EXISTS (
              SELECT 1 
              FROM FRIENDS AS F2
              WHERE F2.friender = $1
                AND F2.friendee = F1.friender
          )
    ) AS FriendsTable
    ON FriendsTable.FriendEmail = U.email;
`;


  try {
    const client = await pool.connect();

    const result = await client.query(sql, [userEmail]);

    client.release();

    console.log(result.rows);
    console.log(' ------END Pending Requests-------');
    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error retrieving friends list:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};




const getTest = (req, res, next) => {
  const sql = 'SELECT * FROM USERS';
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

export {
  approvePost,
  deletePost,
  deleteUser,
  approveUser,
  updateUserInfo,
  connectDB,
  disconnectDB,
  getApprovedUsers,
  getPendingUsers,
  getPendingPosts,
  verifyUserLogin,
  registerNewUser,
  getUserPosts,
  getPostLikes,
  likePost,
  unlikePost,
  checkLikedPost,
  createNewUser,
  createNewPost,
  fileUpload,
  getAllApprovedPosts,
  getAllApprovedPostsByUser,
  createNewCommunity,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
  getUserCommunities,
  getCommunityApprovedPosts,
  createNewCommunityPost,
  getCommunityName,
  searchUser,
  findUser,
  addComment,
  getComment,
  getCommentByCommentID,
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
  getSentFriendRequests,
  getPendingFriendRequests,
  getTest,
  changeColor
};
