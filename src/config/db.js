const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        await mongoose.connect('mongodb://127.0.0.1:27017/inventario')
        console.log('base de datos conectada');
    }
    catch (error){
        console.error('error al conectar la BD', error);
    }
};

module.exports = connectDB;