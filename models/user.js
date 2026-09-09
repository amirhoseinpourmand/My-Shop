const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        minlenght: 4,
        maxlength: 30,
    },
    password: {
        type: String,
        required: true,
    },
    resetToken: String,
    expiredResetDateToken: Date,
    cart: {
        items: [{
            productID: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            }
        }],
    },

});

userSchema.methods.addToCart = function (product) {

    const cartProductIndex = this.cart.items.findIndex(cartProduct => {
        return cartProduct.productID.toString() === product._id.toString()
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productID: product._id,
            quantity: newQuantity
        })
    }

    const updatedCart = {
        items: updatedCartItems
    }
    this.cart = updatedCart;
    return this.save();
};


userSchema.methods.removeFromCart = function (productID) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productID.toString() !== productID.toString();
    })
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function () {
    this.cart = {
        items: [],
    };
    return this.save();
}

module.exports = mongoose.model('User', userSchema);