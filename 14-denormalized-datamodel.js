db =  new Mongo().getDB('movielens');

// Number of males age 25-34 that have rated "The Rock"
db.saip_denormalized_users.mapReduce(
    function() {
        let v = this.value;
        if(v.gender === "M" && v.age === 25) {
            let ratings = v.ratings;
            for (let i = 0; i < ratings.length; i++) {
                let r = ratings[i];
                if (r.movie_id === 733) {
                    emit(r.movie_id, 1);
                }
            }               
        }
    },
    function(key, values) {
        return values.reduce((prev, curr) => prev + curr);
    },
    { out: { inline: 1 } }
).results.forEach(r => printjson(r));

// Number of 1-star ratings for "The Rock" by scientists (occupation=15)
db.saip_denormalized_users.mapReduce(
    function() {
        let v = this.value;
        if(v.occupation === 15)
            return;
        
        v.ratings
            .filter(r => r.movie_id === 733 && r.rating === 1)
            .forEach(r => emit(r.movie_id, 1));
    },
    function(key, values) {
        return values.reduce((p, c) => p + c);
    },
    { out: { inline: 1} }
).results.forEach(r => printjson(r));

// Age-group with the highest average rating for "The Rock"
db.saip_denormalized_users.mapReduce(
    function() {
        let v = this.value;
        v.ratings
            .filter(r => r.movie_id === 733)
            .forEach(r => emit(v.age, { numOfRatings: 1, accumulatedRatings: r.rating }))
    },
    function(key, values) {
        return values.reduce(function(prev, curr) {
            prev.numOfRatings += curr.numOfRatings;
            prev.accumulatedRatings += curr.accumulatedRatings;
            prev.avg = prev.accumulatedRatings / prev.numOfRatings;
            return prev;
        });
    },
    { out: { inline: 1 } }
).results
    .sort((a, b) => b.value.avg - a.value.avg)
    .forEach(r => printjson(r));