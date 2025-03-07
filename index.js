const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const ObjectID = require('mongodb').ObjectId
const cors = require('cors')
const fileupload = require('express-fileupload')
require("dotenv").config();
const port = process.env.PORT || 5000;
let jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const SecretKey = '@GMIT009'
//-----Middleware-----//
app.use(cors())
app.use(express.json());
app.use(fileupload())

//----------DB CONNection------//

const uri = `mongodb+srv://mernlerner:uaqKCl9eMuh8fKFI@cluster0.obwta.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const Database = await client.db("MernLernerDB");

    const Users = Database.collection("users")
    const Products = Database.collection("products")

  //----------AUTH---------------//
    app.post('/signup', async(req, res) => {
      const userData = req.body
      
      const isExistUser = await Users.findOne({email: userData?.email})

      if(isExistUser?.email){
        return res.status(400).json({msg: 'User already exist with this email!'})
      }

      const hashedPassword = await bcrypt.hash(userData?.password, 12)

      const newuser = {
        ...userData,
        password: hashedPassword
      }

      let token = jwt.sign({ email: userData.email}, SecretKey, {
        expiresIn: '8h'
      });

      const result = await Users.insertOne(newuser)

      res.send({msg: 'register success', token})
    })

    app.post('/login', async (req, res) => {
      const {email, password} = req.body

      const oldUser = await Users.findOne({email: email})

      if(!oldUser){
        return res.status(400).json({msg: "Email is wrong"})
      }
      else{
        const passwordCheck = await bcrypt.compare(password, oldUser.password)
        if(!passwordCheck){
          return res.status(400).json({msg: "Password Wrong"})
        }
        let token = jwt.sign({ email: oldUser.email}, SecretKey, {
          expiresIn: '8h'
        });
        res.status(200).json({token: token})
      }

    })

    app.post('/addproduct', async(req, res) => {
     
      const prodData = req.body
      const imgdata = req.files.img.data
      const encoded = imgdata.toString('base64')
      const img = Buffer.from(encoded, 'base64')

      const newObj = {
        ...prodData,
        img: img
      }
      const result = await Products.insertOne(newObj);
     
      res.json({msg: 'Product Added Successfully'})
    })

    app.get('/allproduct', async(req, res) => {
      const result = await Products.find({}).toArray()
      console.log('result', result.length)
      res.json(result)
    })

    app.delete('/deleteprod/:id', async(req, res) => {
      const {id} = req.params

      const query = {_id: new ObjectID(id)}

      const dltResult = await Products.deleteOne(query)
      res.json({msg: 'Product Deleted Successfully'})

    })

    app.get('/singleprod/:id', async(req, res) => {
      const {id} = req.params

      const query = {_id: new ObjectID(id)}

      const result = await Products.findOne(query)
      res.json(result)
    })

    app.put('/updateProd/:id', async(req, res) => {
      const productData = req.body
      const {id} = req.params
      const imgdata = req?.files?.img?.data

      const query = {_id: new ObjectID(id)}

      let updateDoc = {
        $set:{
          ...productData
        }
      }

      if(imgdata){
        const encoded = imgdata.toString('base64')
        const img = Buffer.from(encoded, 'base64')

        updateDoc = {
          $set:{
            ...productData,
            img: img
          }
        }

      }
      else{
        updateDoc = {
          $set:{
            ...productData
          }
        }
      }
      const updatedResult = await Products.updateOne(query, updateDoc)

      res.send({msg: 'Product updated'})
    })

  } finally {
    
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log('Attire Club Server running on port 5000')
})