db =  new Mongo().getDB('movielens');

let outCollection = "saip_rating_dist";

function mapRatingDistribution(){
    let ratings = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    ratings[this.rating + ""] = 1; 
    emit(this.movie_id, { ratings: ratings });
}

function reduceRatingDistribution(key, values){
    let result = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }; 
    for (let i = 0; i < values.length; i++){
        for (let p in result){
            result[p] += values[i].ratings[p]; 
        } 
    } 

    return { ratings: result };
} 

db.ratings.mapReduce(
    mapRatingDistribution,
    reduceRatingDistribution,
    { out: outCollection }
);

db[outCollection].find({ _id: 733 }).forEach(e => printjson(e));