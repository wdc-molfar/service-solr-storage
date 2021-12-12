const { ServiceWrapper } = require("@molfar/csc")
const { AmqpManager, Middlewares } = require("@molfar/amqp-client")
const logger = require("./lib/logger")
const path = require("path")

let service = new ServiceWrapper({
    consumer: null,
    config: null,
    logger: null,

    async onConfigure(config, resolve) {
        this.config = config
        const logFile = this.config.service.config.log
        console.log(`configure ${ this.config._instance_name || this.config._instance_id}`)
        console.log(`${ this.config._instance_name || this.config._instance_id} > Open log ${logFile}`)

        this.logger = logger(logFile)

        this.logger.log("Start session")

        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        await this.consumer.use([
            Middlewares.Json.parse,
            Middlewares.Schema.validator(this.config.service.consume.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                let m = msg.content
                this.logger.log(JSON.stringify(m, null, " "))
                msg.ack()
            }

        ])


        resolve({ status: "configured" })

    },

    onStart(data, resolve) {
        console.log(`start ${ this.config._instance_name || this.config._instance_id}`)
        this.consumer.start()
        resolve({ status: "started" })
    },

    async onStop(data, resolve) {
        console.log(`stop ${ this.config._instance_name || this.config._instance_id}`)
        await this.consumer.close()
        resolve({ status: "stoped" })
    }

})

service.start()