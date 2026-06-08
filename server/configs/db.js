import mongoose from "mongoose";

const connectDB = async () => {
    try {

        await mongoose.connect(
            `${process.env.MONGODB_URI}/agoragpt`
        );

        console.log("MongoDB Connected");

    } catch (error) {

        console.error("MongoDB Error:", error);

        process.exit(1);
    }
};

export default connectDB;