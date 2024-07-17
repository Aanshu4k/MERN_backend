const express = require("express");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const app = express();
const mysql= require("mysql");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = process.env.PORT || 5000;
app.use(cors());
mongoose.connect("mongodb://localhost:27017/tfcf?retryWrites=true&w=majority", {
  // ...
});
const surveySchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  mobile: { type: String, required: true },
  favoriteFood: { type: String, required: true },
  comment: String,
  fetch_flag: {type: String, required : true}
});
const Survey = mongoose.model("Survey", surveySchema);
app.use(express.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Aanshu30",
  database: "mcr",
});

//API to fetch list   of survey from mongoDB collection
app.get("/api/getSurveyList", async (req, resp) => {
  try {
    const surveyData = await Survey.find({fetch_flag:'N'}).limit(5);
    if(surveyData.length===0){
      resp.json({ message: "No more records to fetch." });
      return;
    }
    await Survey.updateMany({_id:{ $in : surveyData.map(data=>data._id)}},{fetch_flag:'Y'});

    resp.json({ data: surveyData });
  } catch (error) {
    resp.status(500).json({ message: "Error fetching Data" });
  }
});

//api to submit a surevy form
app.post("/api/survey", async (req, resp) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();
    resp
      .status(201)
      .json({ message: "Document inserted successfully", survey });
  } catch (error) {
    resp.status(500).json({ message: "Internal Server error !" });
  }
});

//API to convert htmltoimage
app.post("/api/htmltoimage", async (req, resp) => {
  const htmlCode = req.body.html;

  if (!htmlCode) {
    return resp.status(400).json({ error: "HTML code is required" });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlCode);

    // Adjust viewport size if needed
    // await page.setViewport({ width: 1920, height: 1080 });

    const imageBuffer = await page.screenshot({ encoding: "base64" });
    await browser.close();

    resp.send({ imageBase64: imageBuffer });
  } catch (error) {
    console.error("Error: ", error);
    resp.status(500).json({ error: "Internal Server Error" });
  }
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database!');
});
app.use(bodyParser.json());
//API to login
// app.post("/api/login", async (req, resp) => {
//   try {
//     const { userid, password } = req.body;
//     if (!userid || !password) {
//       return resp
//         .status(400)
//         .json({ message: "Username and password are required" });
//     }
//     const updateDateQuery= `update MCR_LOGIN_MST set ACTIVE_FLAG='Y',LAST_LOGIN_DATE= NOW() where LOGIN_ID= ?`;
//     const checkQuery = `SELECT * FROM mcr_login_mst WHERE LOGIN_ID  = ? AND PASSWORD= ? `;
//     connection.query(
//       checkQuery,
//       [userid, password],
//       (err, results) => {
//         if (err) {
//           console.error("Error executing query:", error);
//           resp.status(500).json({ error: "Internal server error" });
//           return;
//         }

//         if (results.length === 1) {
//           // User exists and password matches, create JWT token
//           const user = results[0];
//           const token = jwt.sign({ loginid: user.loginid }, 'abcd1234', { expiresIn: '1h' });
//           connection.query(updateDateQuery,[userid,password],(updateErr)=>{
//             if(updateErr){
//               console.log("Error updating LAST Login Date: ",updateErr);
//               resp.status(500).json({error:"Internal server error!"});
//               return;
//             }
//             resp.json({token});
//           })
//         } else {
//           // User not found or password incorrect
//           resp.status(401).json({ error: 'Invalid login credentials' });
//         }
//       }
//     );
//   } catch (error) {
//     console.log("Error : ", error);
//     resp.status(500).json({ error: "Internal Server Error !" });
//   }
// });

const adminCredentials = {
  id: 'admin',
  password: 'admin'
};

app.post('/api/login', (req, res) => {
  const { id, password } = req.body;

  if (id === adminCredentials.id && password === adminCredentials.password) {
    res.status(200).json({ message: 'Login successful', token: 'your_jwt_token' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
