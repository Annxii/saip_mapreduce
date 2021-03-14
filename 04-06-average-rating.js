db =  new Mongo().getDB('movielens');

let outCollection = "avgRatings";

function mapAvgRating(){
    let value = {
        numOfRatings: 1,
        accumulatedRating: this.rating
    };
    emit(this.movie_id, value);
} 

function reduceAvgRating(key, values){
    let numOfRatings = 0;
    let accumulatedRating = 0;
    values.forEach(e => {
        numOfRatings += e.numOfRatings;
        accumulatedRating += e.accumulatedRating;
    })

    return {
        numOfRatings: numOfRatings,
        accumulatedRating: accumulatedRating,
        average: accumulatedRating / numOfRatings
    };
}

db.ratings.mapReduce(
    mapAvgRating,
    reduceAvgRating,
    {
        out: outCollection 
    });

db[outCollection].find({ "_id": 733 }).forEach(e => printjson(e));