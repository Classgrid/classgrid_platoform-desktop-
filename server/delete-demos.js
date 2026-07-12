import { MongoClient } from 'mongodb';

const uri = "mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to server");
    
    const db = client.db('classgrid');
    const collection = db.collection('demorequests'); // Mongoose pluralizes "DemoRequest" to "demorequests"
    
    const result = await collection.deleteMany({});
    console.log("Deleted documents:", result.deletedCount);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
