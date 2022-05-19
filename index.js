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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) return res.status(403).send({ message: 'Forbidden access' });
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    await client.connect();
    const servicesCollections = client.db('DoctorsPortal').collection('services');
    const bookingCollections = client.db('DoctorsPortal').collection('bookings');
    const userCollections = client.db('DoctorsPortal').collection('users');

    // get all services
    app.get('/services', async (req, res) => {
      const cursor = servicesCollections.find({});
      const services = await cursor.toArray();
      res.send(services);
    });

    //get available appointments
    app.get('/available', async (req, res) => {
      const date = req.query.date;
      const services = await servicesCollections.find().toArray(); //get all services
      const bookings = await bookingCollections.find({ date: date }).toArray(); //get bookings of the specific date
      //remove booked slots
      services.forEach(service => { //loop all the services
        const serviceBookings = bookings.filter(b => b.treatment === service.name); //get the booked service of that day
        const booked = serviceBookings.map(s => s.slot); //get slots array of service found
        const availableSlots = service.slots.filter(s => !booked.includes(s)); // remove the slots on booked array from service slot array
        service.slots = availableSlots; //set the new available slots to the specific service, without available slots
      })
      res.send(services);
    });

    //send a booking
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };
      const exists = await bookingCollections.findOne(query);
      if (exists) { return res.send({ success: false, message: `Already have an appointment on ${exists.date} at ${exists.slot}` }) };
      const result = await bookingCollections.insertOne(booking);
      res.send(result.acknowledged ? { success: true, message: `Booking Successful on ${booking.date} at ${booking.slot}` } : { success: false, message: 'Problem Occurred! Please try again.' });
    })
    //get use bookings
    app.get('/booking', verifyJWT, async (req, res) => {
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      if (patient === decodedEmail) {
        const bookings = await bookingCollections.find({ patient }).toArray();
        res.send(bookings);
      } else return res.status(403).send({ message: 'Forbidden access' });
    });


    //user management
    //get all users
    app.get('/user',verifyJWT,async (req, res) => {
      res.send(await userCollections.find().toArray());
    });

    //update or inset an user
    app.put('/user', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updatedDoc = { $set: user };
      const result = await userCollections.updateOne(filter, updatedDoc, options);
      const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
      res.send({ result, token });
    });
  } finally {

  }
}

run().catch(console.dir);
app.listen(port, () => { console.log(`Running Doctors portal on port: ${port}`) });