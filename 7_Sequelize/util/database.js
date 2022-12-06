const Sequelize = require('sequelize');

const sequelize = new Sequelize('nodejs-complete', 'root', '#88Mma71azh', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;