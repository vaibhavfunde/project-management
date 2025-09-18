import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import router from './routes/index.js';

dotenv.config();
const app = express();

app.use(cors(
  {
    origin : process.env.FRONTEND_URL,
    methods:["GET" ,"POST" , "DELETE","PUT" ],
    allowedHeaders:['Content-Type' , "Authorization"],

  }

))

app.use(morgan("dev"))

//db connection

 mongoose
.connect(process.env.MONGO_URI, )
.then(() => {
  console.log("Database connected successfully");
})
.catch((err) => {
  console.error("Database connection failed:", err.message);
});



app.use(express.json());



app.get('/', async(req, res) => {
  res.status(200).json({
    message: 'Welcome to the backend server!'
  });   
});
//http://localhost:5000/api-v1/
app.use('/api-v1', router);

// error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error 1' });
  });

//not found middleware
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found: ${req.originalUrl}` });   
});
  

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

