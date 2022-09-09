const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

module.exports = app;

app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

// db connection and server initialization
const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Runs on http://localhost/3000/");
    });
  } catch (error) {
    console.log(`DB ERROR :  ${error.message}`);
    process.exit(1);
  }
};

intializeDBandServer();

// user register
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const lengthOfPassword = password.length;
    if (lengthOfPassword >= 5) {
      const createUserQuery = `
    INSERT INTO 
        user (username,name,password,gender,location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// Login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change-password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser != undefined) {
    const isOldPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isOldPasswordMatched) {
      const newPasswordLength = newPassword.length;
      if (newPasswordLength >= 5) {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET password ='${newHashedPassword}'`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
