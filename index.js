const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middlewire
app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {res.send('Doctors Portal Server Start')})
app.listen(port,()=>{console.log(`Running Doctors portal on port: ${port}`)})