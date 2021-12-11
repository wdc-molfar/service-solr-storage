const path = require("path")
const fs = require("fs")

const { Container } = require("@molfar/csc")
const { yaml2js, deepExtend } = require("@molfar/amqp-client")


const workerPath = path.resolve(__dirname, "../service.js")
let workerConfig = yaml2js(fs.readFileSync(path.resolve(__dirname, "../service.msapi.yaml")).toString())
const exampleConfig = yaml2js(fs.readFileSync(path.resolve(__dirname, "./config.yaml")).toString())

workerConfig = deepExtend( workerConfig, exampleConfig)
delete workerConfig.service.consume.message.$ref

console.log(JSON.stringify(workerConfig, null, " "))

const delay = interval => new Promise( resolve => {
	setTimeout( () => {
		resolve()
	}, interval )	
}) 


const run = async () => {

	const container = new Container()

	container.hold(workerPath, "--worker 1--")
	
	const worker1 = await container.startInstance(container.getService(s => s.name == "--worker 1--"))
	let res = await worker1.configure(workerConfig)
	console.log(res)
	
	
	res = await worker1.start()
	console.log(res)

	
	// await delay(10000)

	// res = await worker1.stop()
	
	// container.terminateAll()
	
}

run()