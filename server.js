import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
//var moment = require('moment'); // require
//const moment = require('moment-timezone'); //moment-timezone
app.use(cors());
app.use(express.static(path.join(__dirname, 'dist/')));
app.get('/{*splat}', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log("Listening on port 8001");
});