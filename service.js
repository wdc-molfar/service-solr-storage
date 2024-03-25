const { ServiceWrapper } = require("@molfar/csc")
const { AmqpManager, Middlewares } = require("@molfar/amqp-client")
const axios = require("axios")

let service = new ServiceWrapper({
    consumer: null,
    config: null,

    async onHeartbeat(data, resolve){
        resolve({})
    },


    async onConfigure(config, resolve) {
        this.config = config
        console.log(new Date(), `configure ${ this.config._instance_name || this.config._instance_id}`)
        console.log(new Date(), JSON.stringify(this.config, null, " "))
        

        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        axios.defaults.baseURL = config.service.solr.url

        await this.consumer.use([
            Middlewares.Json.parse,
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                if (err) next()    
                let m = msg.content

                console.log(new Date(), "consume", JSON.stringify(m, null, " "))
                
                
                if(m.scraper && m.scraper.message){
                    try {
                        // m.scraper.message.md5
                        let query =  {
                            query:`scraper.message.md5:${m.scraper.message.md5}`
                        }
                        result = await axios.post(`/${config.service.solr.collection}/query`,query)
                        result = result.data.response.docs
                        if (result.length === 0){
                            axios({
                                method: 'post',
                                url: `/${config.service.solr.collection}/update/json/docs`,
                                data: [m]
                            }).then((response) => {
                                console.log(response);
                            }, (error) => {
                                console.log(error);
                            });
                        }else{
                            console.log("already exists", m.scraper.message.text, m.scraper.message.md5)
                        }
                    } catch (e) {
                        console.log(e.toString())
                    }
                } else {
                    console.log(new Date(), "ignore (no scraper or message)", JSON.stringify(m, null, " "))
                }
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