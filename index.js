// =====================Server Part========================
const express = require('express')
const app = express()
const cors = require('cors')

const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())

// =====================Database Part========================

require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lvecozg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // await client.connect();

    const usersCollection = client.db('MilkManagement').collection('users')

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    
    })

    app.get("/users", async (req, res) => {
     
      const query = { email: req.query.email }
      console.log(query)
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    app.get('/pending-users', async (req, res) => {
      const query = { status: req.query.status }
      console.log(req.query)
      const result = await usersCollection.find(query).toArray();
      res.send(result)
      console.log(result)

    })

    app.get("/approved-users",async(req,res)=>{
      const qurey={status:req.query.status}
      const result = await usersCollection.find(qurey).toArray()
      res.send(result)
    })

    app.patch("/users/:id", async (req, res) => {
      const filter = {_id: new ObjectId(req.params.id)}
      const updateData = { $set: req.body }
      const result = await usersCollection.updateOne(filter, updateData);
      res.send(result)
    
    })

    app.delete("/users/:id",async(req,res)=>{
      const filter= {_id: new ObjectId(req.params.id)};
      const result = await usersCollection.deleteOne(filter)
      res.send(result)
    })










    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);























// =====================Finishing Part of Server========================
app.get("/", (req, res) => {
  res.send("Milk Management Server is Running...")
})

app.listen(port, () => {
  console.log(`Server is runnning on port ${port}`)
})
