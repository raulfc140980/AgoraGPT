import axios from "axios"
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import imagekit from "../configs/imageKit.js"
import openai from '../configs/openai.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const openAIWithRetry = async (fn, maxAttempts = 3) => {
    let attempt = 0

    while (true) {
        try {
            return await fn()
        } catch (error) {
            attempt += 1
            const isRateLimit = error?.status === 429
            if (!isRateLimit || attempt >= maxAttempts) {
                throw error
            }
            const backoffMs = 1000 * 2 ** (attempt - 1)
            console.warn(`OpenAI rate limit hit, retrying in ${backoffMs}ms (attempt ${attempt}/${maxAttempts})`)
            await delay(backoffMs)
        }
    }
}

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

         // Check credits
        if(req.user.credits < 1){
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }

        const {chatId, prompt} = req.body

        const chat = await Chat.findOne({userId, _id: chatId})
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})

        const response = await openAIWithRetry(() =>
            openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            })
        )

        if (!response || !response.choices || response.choices.length === 0) {
            throw new Error('OpenAI returned no completion choices')
        }

        const reply = { ...response.choices[0].message, timestamp: Date.now(), isImage: false }
        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } })

        res.json({ success: true, reply })

    } catch (error) {
        const message = error?.status === 429
            ? 'Rate limit exceeded. Please wait a moment before trying again.'
            : error.message || 'An error occurred while processing your request.'

        console.error('textMessageController error:', error)
        res.status(error?.status || 500).json({ success: false, message })
    }
}

// Image Generation Message Controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        // Check credits
        if(req.user.credits < 2){
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }
        const {prompt, chatId, isPublished} = req.body
        // Find chat
        const chat = await Chat.findOne({userId, _id: chatId})

         // Push user message
         chat.messages.push({
            role: "user", 
            content: prompt, 
            timestamp: Date.now(), 
            isImage: false});

        // Encode the prompt
        const encodedPrompt = encodeURIComponent(prompt)

        // Construct ImageKit AI generation URL
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

        // Trigger generation by fetching from ImageKit
        const aiImageResponse = await axios.get(generatedImageUrl, {responseType: "arraybuffer"})

        // Convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data,"binary").toString('base64')}`;

        // Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        })

        const reply = {
                role: 'assistant',
                content: uploadResponse.url,
                timestamp: Date.now(), 
                isImage: true,
                isPublished
        }

         res.json({success: true, reply})

         chat.messages.push(reply)
         await chat.save()

          await User.updateOne({_id: userId}, {$inc: {credits: -2}})

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}