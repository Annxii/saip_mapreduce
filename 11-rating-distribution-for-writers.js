db =  new Mongo().getDB('movielens');

let filteredUsers = db.users
    .find({ "occupation": 20},{ _id: 1})
    .toArray()
    .reduce((acc, x) => { acc[x._id] = 1; return acc; },{});

let outCollection = "saip_writer_rating_distribution";

function mapWriterRatingDistribution() {

} 

function reduceWriterRatingDistribution(key, values) {

}

db.ratings.mapReduce(
    mapWriterRatingDistribution,
    reduceWriterRatingDistribution,
    {
        out: outCollection,
        scope: {
            users: filteredUsers 
        }
    }
)
/**/