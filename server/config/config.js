require('dotenv').config({ path: __dirname + '/../.env' }); // .env 경로 지정

module.exports = {
  development: {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
      timezone: '+09:00'
    }
  },
  test: {
    
  },
  production: {
    host: '',
    database: '',
    username: '',
    password: '',
    dialect: '',
  }
};