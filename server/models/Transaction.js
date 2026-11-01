
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true
        },

        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than zero']
        },

        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            default: Date.now
        },

        description: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
