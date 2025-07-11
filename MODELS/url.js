const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
    {   
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        shortId: {
            type: String,
            required: true,
            unique: true,
        },
        redirectURL:{
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date, // Expiration date for the link
            required: false,
        },
        shortUrl:{
            type: String,
            required: true,
        },
        remarks: {
            type: String,
            required: false,
    },
        visithistory: [
            {
                timestamp: { type: Date, default: Date.now },
                ipAddress: { type: String },
                userAgent: { type: String },
                deviceType: { type: String },
            },
        ],
    },
    {
        timestamps: true
    }
);

const URL = mongoose.model("url", urlSchema);

module.exports = URL;