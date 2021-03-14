db =  new Mongo().getDB('movielens');

let count = db.users
    .find({ "occupation": 20 })
    .count();

print(count);