import mongoose from "mongoose";

const connectDB = async () => {
    try {

        await mongoose.connect(
            `${process.env.MONGODB_URI}/agora_gpt`
        );

        console.log("MongoDB Connected");

    } catch (error) {

        console.error("MongoDB Error:", error);

        process.exit(1);
    }
};

export default connectDB;