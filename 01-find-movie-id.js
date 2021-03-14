db =  new Mongo().getDB('movielens');

db.movies.find({
    "title": { $regex: /^Rock.+1996/}
})
.forEach(e =>{ print(e._id)} );