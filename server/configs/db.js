import mongoose from 'mongoose';

const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=> console.log('Database connected'))
        mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err))

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not set in environment')
        }

        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message)
        throw error
    }
}

export default connectDB;