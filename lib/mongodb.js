const mongo = require('mongodb').MongoClient


let options
let client, db


const getClient = async () => {
	
	if(!client){
		client = await mongo.connect(options.service.mongodb.url, {
		    useNewUrlParser: true,
		    useUnifiedTopology: true
		})
		
		client.on('close', () => {
	      client = null; // clear client
	    });
	
	}

	return client
}


const normalize = str => {
	str = str.split(".")
	return {
		dbName: str[0],
		collectionName: str[1]
	}
}	


const replaceOne = async (collectionName, filter, data) => {
	
	try {
		
		let client = await getClient()

		let conf = normalize(collectionName)
		let db = client.db(conf.dbName)
	    let collection = db.collection(conf.collectionName)
	    await collection.replaceOne(filter, data, {upsert: true})
	} catch (e) {
	
		throw e
	
	} finally {
	
	
	}    
}


const listCollections = async dbSchema => {

	try {
	
		let client = await getClient()

			
		let conf = normalize(dbSchema)
		const res =  await client
						.db(conf.dbName)
	    				.listCollections()
	    				.toArray()

		return res
	
	} catch (e) {
	
		throw e
	
	} finally {
	
		// if (client)  client.close()
	
	}		
	
}

const close = () => {
	if(client && client.close) client.close()
}

module.exports = opts => {

	options = opts
	return {		
		client,
		replaceOne,
		insertOne: replaceOne,
		close
	}	

}

