const { MongoClient, ObjectID, connect } = require('mongodb');

function circulationRepo() {
    const url = 'mongodb://localhost:27017';
    const dbName = 'circulation';

    function getById(id) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            await client.connect();
            try {
                const db = client.db(dbName);
                const data = await db.collection('newspaper').findOne({ _id: ObjectID(id) });
                resolve(data);
                client.close();

            } catch (error) {
                reject(error);
            }
        })
    }

    function get(query, limit) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                let results = db.collection('newspaper').find(query);
                // find command return cursor
                if (limit > 0) {
                    results = results.limit(limit);
                }

                resolve(await results.toArray());
                client.close();
            } catch (error) {
                reject(error)
            }
        })
    }

    function add(newItem) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            await client.connect();

            try {
                const db = client.db(dbName);
                const addedItem = await db.collection('newspaper').insertOne(newItem);
                resolve(addedItem.ops[0]);
                client.close()
            } catch (error) {
                reject(error);
            }
        })
    }

    function update(id, update) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            await client.connect();
            try {
                const db = client.db(dbName);
                const item = await db.collection('newspaper').findOneAndReplace({ _id: ObjectID(id) }, update, { returnOriginal: false });
                resolve(item.value);
            } catch (error) {
                reject(error);
            }
        })
    }

    function remove(id) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            await client.connect();
            try {
                const db = client.db(dbName);
                const removedItem = await db.collection('newspaper').deleteOne({ _id: ObjectID(id) });
                resolve(removedItem.deletedCount === 1);
            } catch (error) {
                reject(error);
            }
        })
    }

    function loadData(data) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                const results = await db.collection('newspaper').insertMany(data);
                resolve(results);
                client.close();
            } catch (error) {
                reject(error)
            }
        })
    }

    function averageFinalist() {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            await client.connect();
            try {
                const db = client.db(dbName);
                const average = await db.collection('newspaper').aggregate(
                    [
                        { $group: { _id: 'all', averageFinalist: { $avg: '$Pulitzer Prize Winners and Finalists, 1990-2014' } } }
                    ]
                ).toArray();

                resolve(average[0].averageFinalist)
                client.close();
            } catch (error) {
                reject(error)
            }

        });
    }

    function averageFinalistByChange() {

        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            await client.connect();
            try {
                const db = client.db(dbName);
                const average = await db.collection('newspaper')
                    .aggregate([
                        {
                            $project: {
                                "Newspaper": 1,
                                "Pulitzer Prize Winners and Finalists, 1990-2014": 1,
                                "Change in Daily Circulation, 2004-2013": 1,
                                overallChange: {
                                    $cond: { if: { $gte: ['$Change in Daily Circulation, 2004-2013', 0] }, then: 'positive', else: 'negative' }
                                }
                            }
                        },
                        {
                            $group: { _id: '$overallChange', averageFinalist: { $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014" }, sum: { $sum: 1 } }
                        }
                    ]).toArray();
                resolve(average)
                client.close();
            } catch (error) {
                reject(error);
            }
        })

    }

    return { loadData, get, getById, add, update, remove, averageFinalist, averageFinalistByChange }
}

module.exports = circulationRepo();