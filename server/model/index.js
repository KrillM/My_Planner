const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 1. 모델 로드
db.Crew = require('./crew')(sequelize);
db.Date = require('./date')(sequelize);
db.ToDo = require('./toDo')(sequelize);
db.FrequencyMemo = require('./frequencyMemo')(sequelize);
db.DateMemo = require('./dateMemo')(sequelize);
db.Frequency = require('./frequency')(sequelize);
db.List = require('./list')(sequelize);
db.Event = require('./event')(sequelize);

// 2. 관계(Association) 및 CASCADE 설정
const cascadeOptions = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };

// Crew 기반 1:N 관계
db.Crew.hasMany(db.Date, { foreignKey: 'crewId', ...cascadeOptions });
db.Crew.hasMany(db.Frequency, { foreignKey: 'crewId', ...cascadeOptions });
db.Crew.hasMany(db.Event, { foreignKey: 'crewId', ...cascadeOptions });

// Date 기반 관계
db.Date.hasMany(db.ToDo, { foreignKey: 'dateId', ...cascadeOptions });
db.Date.hasMany(db.DateMemo, { foreignKey: 'dateId', ...cascadeOptions });

// Frequency 기반 관계
db.Frequency.hasMany(db.List, { foreignKey: 'frequencyId', ...cascadeOptions });
db.Frequency.hasMany(db.FrequencyMemo, { foreignKey: 'frequencyId', ...cascadeOptions });

// belongsTo 설정 (역방향)
db.Date.belongsTo(db.Crew, { foreignKey: 'crewId' });
db.ToDo.belongsTo(db.Date, { foreignKey: 'dateId' });
db.DateMemo.belongsTo(db.Date, { foreignKey: 'dateId' });
db.Frequency.belongsTo(db.Crew, { foreignKey: 'crewId' });
db.FrequencyMemo.belongsTo(db.ToDo, { foreignKey: 'frequencyId' });
db.List.belongsTo(db.Frequency, { foreignKey: 'frequencyId' });
db.Event.belongsTo(db.Crew, { foreignKey: 'crewId' });

module.exports = db;