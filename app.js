const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const circulationRepo = require('./repos/circulationRepo');
const data = require('./circulation.json');

const url = 'mongodb://localhost:27017';
const dbName = 'circulation';

async function main() {
  const client = new MongoClient(url);
  await client.connect();

  try {
    const results = await circulationRepo.loadData(data);
    assert.equal(data.length, results.insertedCount);

    const items = await circulationRepo.get();
    assert.equal(data.length, items.length)

    const limtData = await circulationRepo.get({}, 4);
    assert.equal(limtData.length, 4)

    const filterData = await circulationRepo.get({ Newspaper: items[4].Newspaper });
    assert.deepEqual(filterData[0], items[4]);

    const id = items[4]._id.toString();
    const filterById = await circulationRepo.getById(id);
    assert.deepEqual(filterById, items[4]);

    const newItem = {
      "Newspaper": "My News paper",
      "Daily Circulation, 2004": 100,
      "Daily Circulation, 2013": 200,
      "Change in Daily Circulation, 2004-2013": 21,
      "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
      "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
      "Pulitzer Prize Winners and Finalists, 1990-2014": 0
    };

    const addedItem = await circulationRepo.add(newItem);
    assert(addedItem._id);

    const addedItemQuery = await circulationRepo.getById(addedItem._id);
    assert.deepEqual(addedItemQuery, addedItem);

    const updatedItem = await circulationRepo.update(addedItemQuery._id, {
      "Newspaper": "My new newspaper",
      "Daily Circulation, 2004": 100,
      "Daily Circulation, 2013": 200,
      "Change in Daily Circulation, 2004-2013": 21,
      "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
      "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
      "Pulitzer Prize Winners and Finalists, 1990-2014": 0

    });
    assert.equal(updatedItem.Newspaper, "My new newspaper");
    const updateItemQuery = await circulationRepo.getById(updatedItem._id);
    assert.equal(updateItemQuery.Newspaper, "My new newspaper");

    const removedItem = await circulationRepo.remove(updateItemQuery._id);
    assert(removedItem);

    const avgFinalist = await circulationRepo.averageFinalist();
    console.log('avgFinalist ', avgFinalist);

    const avgFinalistByChange = await circulationRepo.averageFinalistByChange();
    console.log(avgFinalistByChange);

  } catch (error) {
    console.log(error);
  } finally {
    const admin = client.db(dbName).admin();

    await client.db(dbName).dropDatabase();
    console.log(await admin.listDatabases());
    client.close();

  }
}

main();