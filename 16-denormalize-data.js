db =  new Mongo().getDB('movielens');

let outCollection = "saip_denormalized_movies";

db.users.mapReduce(
    function () {
        let item = {
            id: this._id,
            gender: this.gender,
            age: this.age,
            occupation: this.occupation,
            zip_code: this.zip_code,
            ratings: []
        };
        emit(this._id, item);
    },
    function (key, values) { return values[0]; },
    { out: outCollection }
);

printjson(db[outCollection].findOne());

//*
db.ratings.mapReduce(
    function () {
        let item = {
            ratings: [
                {
                    movie_id: this.movie_id,
                    rating: this.rating,
                    timestamp: this.timestamp
                }
            ]
        };
        emit(this.user_id, item);
    },
    function (key, values) {
        let result = { ratings: [] };
        values.forEach(function(e) {
            if(e.gender) {
                result.id = e.id;
                result.gender = e.gender;
                result.age = e.age;
                result.occupation = e.occupation;
                result.zip_code = e.zip_code;
            }

            Array.prototype.push.apply(result.ratings, e.ratings);
        });

        return result;
    },
    { out: { "reduce": outCollection } }
);
/* */

printjson(db[outCollection].findOne());

db[outCollection].mapReduce(
    function() {
       let v = this.value;
       for(let i = 0; i < v.ratings.length; i++) {
           let r = v.ratings[i];
           let item = {
               id: r.movie_id,
               ratings: [
                   {
                       rating: r.rating,
                       timestamp: r.timestamp,
                       user: {
                           id: v.id,
                           gender: v.gender,
                           age: v.age,
                           occupation: v.occupation,
                           zip_code: v.zip_code
                       }
                   }
               ]
           };
           emit(r.movie_id, item);
       }
    },
    function(key, values) {
        let result = {
            id: key,
            ratings: []
        };

        values.forEach(e => Array.prototype.push.apply(result.ratings, e.ratings));

        return result;
    },
    { out: outCollection }
);

printjson(db[outCollection].findOne({ _id: 733 }));

db.movies.mapReduce(
    function() {
        emit(this._id, {
            id: this._id,
            title: this.title,
            genres: this.genres,
            ratings: []
        });
    },
    function(key, values) {
        let result = {
            id: key,
            title: undefined,
            genres: undefined,
            ratings: []
        };

        values.forEach(e => {
            if(e.title) {
                result.title = e.title;
                result.genres = e.genres;
            }

            Array.prototype.push.apply(result.ratings, e.ratings);
        });

        return result;
    },
    { out: {"reduce": outCollection } }
)

printjson(db[outCollection].findOne({ _id: 733 }));