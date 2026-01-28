import mongoose from "mongoose";

import dotenv from "dotenv"
dotenv.config()

let db = () => {
    mongoose.connect(process.env.MONGO_URL)
.then((res) => {
    console.log("Connect Succesfully")
})
.catch((err) => {
    console.log("Connect Failed")
})

}

export default db;
