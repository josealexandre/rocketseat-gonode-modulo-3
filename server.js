require('dotenv').config()

const express = require('express')
const routes = require('./routes')
const mongoose = require('mongoose')
const databaseConfig = require('./config/database')
const sentryConfig = require('./config/sentry')

const validate = require('express-validation')
const Youch = require('youch')
const Sentry = require('@sentry/node')

class App {
    constructor () {
        this.express = express()
        this.isDev = process.env.NODE_ENV !== 'production'

        this.sentry()
        this.database()
        this.middlewares()
        this.routes()
        this.exceptions()
    }

    sentry () {
        Sentry.init(sentryConfig)
    }

    database () {
        mongoose.connect(databaseConfig.uri, {
            useCreateIndex: true,
            useNewUrlParser: true
        })
    }

    middlewares () {
        this.express.use(Sentry.Handlers.requestHandler())
        this.express.use(express.json())
    }

    routes () {
        this.express.use(routes)
    }

    exceptions () {
        if (process.env.NODE_ENV === 'production') {
            this.express.use(Sentry.Handlers.errorHandler())
        }

        this.express.use(async (err, req, res, next) => {
            if (err instanceof validate.ValidationError) {
                return res.status(err.status).json(err)
            }

            if (process.env.NODE_ENV !== 'production') {
                const youch = new Youch(err, req)
                return res.json(await youch.toJSON())
                // return res.send(await youch.toHTML())
            }

            return res.status(500).json({ error: 'Internal Server Error' })
        })
    }
}

module.exports = new App().express
