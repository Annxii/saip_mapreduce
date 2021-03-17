db =  new Mongo().getDB('movielens');

if(!occupation) {
    throw '\'occupation\' not specified';
}

let users = db.users.mapReduce(
    function() { emit(1, [this._id]); },
    function(key, values) { return Array.prototype.concat.apply([], values); },
    {
        out: { inline: 1},
        query: { "occupation": occupation }
    }
).results[0].value;


let outCollection = `saip_occupation_${occupation}_rating_distribution`;

function mapWriterRatingDistribution() {
    let distribution = new Array(5).fill(0);
    distribution[this.rating - 1] = 1;
    emit(this.movie_id, distribution);
} 

function reduceWriterRatingDistribution(key, values) {
    let result = new Array(5).fill(0);
    for (let i = 0; i < values.length; i++) {
        for (let x = 0; x < result.length; x++) {
            result[x] += values[i][x];
        }
    }

    return result;
}

db.ratings.mapReduce(
    mapWriterRatingDistribution,
    reduceWriterRatingDistribution,
    {
        out: outCollection,
        query: { "user_id": { $in: users }}
    }
);

db[outCollection]
    .find({ _id: { $gte: 733 }})
    .sort({ _id: 1})
    .limit(10)
    .forEach(e => printjson(e));