const { ServiceWrapper } = require("@molfar/csc")
const { AmqpManager, Middlewares } = require("@molfar/amqp-client")
const path = require("path")
const axios = require("axios")

let service = new ServiceWrapper({
    consumer: null,
    config: null,
    
    //-------------- Add heartbeat exported method

         async onHeartbeat(data, resolve){
            resolve({})
        },
 
    //--------------------------------------------



    async onConfigure(config, resolve) {
        this.config = config
        console.log(new Date(), `configure ${ this.config._instance_name || this.config._instance_id}`)
        console.log(new Date(), JSON.stringify(this.config, null, " "))
        
        this.mongodb = require("./lib/mongodb")(this.config)

        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        /////////////////////// SET AXIOS baseURL (need for no 80 port) /////////////////// 
        axios.defaults.baseURL = config.service.solr.url
        ///////////////////////////////////////////////////////////////////////////////////

        await this.consumer.use([
            Middlewares.Json.parse,
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                if (err) next()    
                let m = msg.content

                console.log(new Date(), "consume", JSON.stringify(m, null, " "))
                
                
                if(m.scraper && m.scraper.message){
                
                //////////////////// AXIOS post example //////////////////////////////////    
                    
                    // axios.post(
                          // `/${config.service.solr.collection}//update/json/docs`,
                          // m  
                    // )

                //////////////////////////////////////////////////////////////////////////    

                
                /////////////////// TODO replace this code ////////////////////////////////



                    try {
                        axios({
                            method: 'post',
                            url: 'http://localhost:8983/solr/core/update/json/docs',
                            data: [m.scraper.message]
                        }).then((response) => {
                            console.log(response);
                        }, (error) => {
                            console.log(error);
                        });
                    } catch (e) {
                        console.log(e.toString())
                    }
                    // try {
                    //     let res = await this.mongodb.insertOne(
                    //         `${this.config.service.mongodb.db}.${this.config.service.mongodb.collection}`,
                    //         {"scraper.message.md5": m.scraper.message.md5},
                    //         m
                    //     )
                    //     console.log(new Date(), `insert into ${this.config.service.mongodb.db}.${this.config.service.mongodb.collection} md5: ${m.scraper.message.md5}`, res)
                    // } catch (e) {
                    //     console.log(e.toString())
                    // }

                
                ///////////////////////////////////////////////////////////////////////////////
    
                
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
        this.mongodb.close()

        resolve({ status: "stoped" })
    
    }

})

service.start()