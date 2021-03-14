db =  new Mongo().getDB('movielens');

let movie_id = 733;
let outCollection = "ratingDistribution_" + movie_id;

function mapNumOfRating(){
    emit(this.rating, 1);
} 

function reduceNumOfRatings(key, values){
    let total = 0;
    for (let i = 0; i < values.length; i++){
        total += values[i];
    }

    return total;
}

db.ratings.mapReduce(
    mapNumOfRating,
    reduceNumOfRatings,
    {
        out: outCollection,
        query: { "movie_id": movie_id } 
    });

db[outCollection].find().sort({ _id: 1}).forEach(e => printjson(e));