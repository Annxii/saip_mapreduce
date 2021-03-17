db =  new Mongo().getDB('movielens');

let outCollection = "saip_rating_dist";

function mapRatingDistribution() {
    let distribution = new Array(5).fill(0);
    distribution[this.rating - 1] = 1;
    emit(this.movie_id, distribution);
} 

function reduceRatingDistribution(key, values) {
    let result = new Array(5).fill(0);
    for (let i = 0; i < values.length; i++) {
        for (let x = 0; x < result.length; x++) {
            result[x] += values[i][x];
        }
    }

    return result;
}

db.ratings.mapReduce(
    mapRatingDistribution,
    reduceRatingDistribution,
    { out: outCollection }
);

db[outCollection]
    .find({ _id: { $gte: 733 } })
    .sort({_id: 1})
    .limit(10)
    .forEach(e => printjson(e));