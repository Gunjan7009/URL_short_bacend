const mongoose = require('mongoose');
// mongoose.set("strictQuery", true);
async function mongoConnect(url){
    return mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
}

module.exports = {
    mongoConnect,
}