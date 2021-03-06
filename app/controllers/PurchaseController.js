const Ad = require('../models/Ad')
const Purchase = require('../models/Purchase')
const User = require('../models/User')
const Queue = require('../services/Queue')
const PurchaseMail = require('../jobs/PurchaseMail')

class PurchaseController {
    async store (req, res) {
        const { content, ad } = req.body

        const purchaseAd = await Ad.findById(ad).populate('author')
        const user = await User.findById(req.userId)

        Queue.create(PurchaseMail.key, {
            ad: purchaseAd,
            user,
            content
        }).save()

        const purchase = await Purchase.create({
            ad,
            user: req.userId,
            content
        })

        return res.send(purchase)
    }
}

module.exports = new PurchaseController()
