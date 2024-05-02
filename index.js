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
const moment = require('moment');
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
    const rateCollection = client.db("MilkManagement").collection("rates")
    const importsCollection = client.db("MilkManagement").collection("imports")
    const exportsCollection = client.db("MilkManagement").collection("exports")
    const paymentsCollection = client.db("MilkManagement").collection("payments")




    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);

    })

    app.get("/users", async (req, res) => {
      const query = { email: req.query.email }
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    app.get('/pending-users', async (req, res) => {
      const query = { status: req.query.status }
      const result = await usersCollection.find(query).toArray();
      res.send(result)

    })

    app.get("/approved-users", async (req, res) => {
      const qurey = { status: req.query.status }
      const result = await usersCollection.find(qurey).toArray()
      res.send(result)
    })

    app.patch("/users/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) }
      const updateData = { $set: req.body }
      const result = await usersCollection.updateOne(filter, updateData);
      res.send(result)

    })

    app.get("/seller", async (req, res) => {
      const filter = req.query;
      const result = await usersCollection.find(filter).toArray()
      res.send(result)

    })

    app.get("/admin", async (req, res) => {
      const filter = req.query;
      const result = await usersCollection.findOne(filter)
      res.send(result)

    })

    app.delete("/users/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await usersCollection.deleteOne(filter)
      res.send(result)
    })


    app.post("/rates", async (req, res) => {
      // const date = moment(req.body.rateDate, "YYYY-MMM-DD").format("YYYY-MM-DD")

      const rateData = {
        rateDate: moment(req.body.rateDate).format("YYYY-MM-DD"),
        newRate: parseFloat(req.body.newRate)
      }
      const result = await rateCollection.insertOne(rateData)
      res.send(result)
    })



    app.get("/rates", async (req, res) => {
      const result = await rateCollection.findOne({}, {
        sort: { rateDate: -1 }
      })
      res.send(result)

    })



    app.post("/imports", async (req, res) => {
      const saleData = {
        sellerName: req.body.sellerName,
        sellerEmail: req.body.sellerEmail,
        ie: req.body.ie,
        sellingDate: moment(req.body.sellingDate).format("YYYY-MM-DD"),
        reportingDate: moment(req.body.reportingDate).format("YYYY-MM-DD"),
        soldAmount: parseFloat(req.body.soldAmount),
        rate: parseFloat(req.body.rate),
        price: parseFloat(req.body.price),
        status: req.body.status
      };

      const result = await importsCollection.insertOne(saleData)
      res.send(result)
    })

    app.get("/imports", async (req, res) => {
      const numberOfDoc = await importsCollection.estimatedDocumentCount();
      const query = req.query
      const importerInfo = await importsCollection.find(query).toArray()
      const sum = await importsCollection.aggregate([
        {
          $match: {
            status: query.status
          }
        },

        {
          $group: {
            _id: null,
            impTotalTk: { $sum: '$price' },
            impTotalAmount: { $sum: "$soldAmount" },

          }
        },
      ]).toArray();
      const impTotalAmount = sum.length > 0 ? sum[0].impTotalAmount : 0
      const impTotalTk = sum.length > 0 ? sum[0].impTotalTk : 0
      res.send({ numberOfDoc, impTotalTk, impTotalAmount, importerInfo })
    })

    app.patch("/imports/:id", async (req, res) => {

      const filter = { _id: new ObjectId(req.params.id) }
      const updateData = { $set: req.body };
      const result = await importsCollection.updateOne(filter, updateData)
      res.send(result)
    })


    app.post("/exports", async (req, res) => {
      const buyingData = {
        buyerName: req.body.buyerName,
        buyerEmail: req.body.buyerEmail,
        ie: req.body.ie,
        buyingDate: moment(req.body.buyingDate).format("YYYY-MM-DD"),
        reportingDate: moment(req.body.reportingDate).format("YYYY-MM-DD"),
        buyingAmount: parseFloat(req.body.buyingAmount),
        rate: parseFloat(req.body.rate),
        price: parseFloat(req.body.price),

      };
      const result = await exportsCollection.insertOne(buyingData)
      res.send(result)
    })


    app.get("/exports", async (req, res) => {
      const result = await exportsCollection.aggregate([
        {
          $group: {
            _id: null,
            expTotalTk: {
              $sum: '$price'
            },
            expTotalAmount: {
              $sum: "$buyingAmount"
            }
          }
        }
      ]).toArray();
      const expTotalTk = result.length > 0 ? result[0].expTotalTk : 0;
      const expTotalAmount = result.length > 0 ? result[0].expTotalAmount : 0;
      res.send({ expTotalAmount, expTotalTk })
    })

    app.get("/exports/:email", async (req, res) => {
      const qurey = req.params.email
      console.log(qurey)
      const currentDate = moment();
      const currentMonth = currentDate.month() + 1
      const currentYear = currentDate.year()

      const result = await exportsCollection.find({
        buyerEmail: qurey,
        buyingDate: {
          $gte: moment().startOf('month').toDate(),
          $lt: moment().endOf('month').toDate()
        }

      }).toArray()

      console.log(result)
    })


    app.post("/payments", async (req, res) => {
      paymentData = req.body;
      const result = await paymentsCollection.insertOne(paymentData);
      res.send(result)

    })


    app.get("/payment-request-to-seller", async (req, res) => {
      const query = req.query
      const result = await paymentsCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/payment-request-to-manager", async (req, res) => {
      const query = req.query
      const result = await paymentsCollection.find(query).toArray()
      res.send(result)
      console.log(result)
    })


    app.patch("/payments/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) }
      const updateData = { $set: req.body };
      const result = await paymentsCollection.updateOne(filter, updateData)
      res.send(result)
      console.log(result)
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
