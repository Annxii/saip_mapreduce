db =  new Mongo().getDB('movielens');

let count = db.ratings.find(
    {
        "movie_id": 733,
        "rating": 5
    }).count();

print(count);