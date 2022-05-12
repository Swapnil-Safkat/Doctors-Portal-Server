const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

//middlewire
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => { res.send('Doctors Portal Server Start') });

const uri = `mongodb+srv://${process.env.DB_USER
  }:${process.env.DB_PASS
  }@learningmongo.qf50z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    await client.connect();
    const servicesCollections = client.db('DoctorsPortal').collection('services');

    app.get('/services', async (req, res) => {
      const cursor = servicesCollections.find({});
      const services = await cursor.toArray();
      res.send(services);
    });
  } finally {

  }
}

run().catch(console.dir);
app.listen(port, () => { console.log(`Running Doctors portal on port: ${port}`) });