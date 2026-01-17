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
db.YearlyPlan = require('./yearlyPlan')(sequelize);
db.MonthlyPlan = require('./monthlyPlan')(sequelize);
db.Goal = require('./goal')(sequelize);
db.Date = require('./date')(sequelize);
db.ToDo = require('./toDo')(sequelize);
db.TodoMemo = require('./todoMemo')(sequelize);
db.DateMemo = require('./dateMemo')(sequelize);
db.Frequency = require('./frequency')(sequelize);
db.List = require('./list')(sequelize);
db.Event = require('./event')(sequelize);

// 2. 관계(Association) 및 CASCADE 설정
const cascadeOptions = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };

// Crew 기반 1:N 관계
db.Crew.hasMany(db.YearlyPlan, { foreignKey: 'crewId', ...cascadeOptions });
db.Crew.hasMany(db.Goal, { foreignKey: 'crewId', ...cascadeOptions });
db.Crew.hasMany(db.Date, { foreignKey: 'crewId', ...cascadeOptions });
db.Crew.hasMany(db.Frequency, { foreignKey: 'crewId', ...cascadeOptions });
db.Crew.hasMany(db.Event, { foreignKey: 'crewId', ...cascadeOptions });

// YearlyPlan -> MonthlyPlan
db.YearlyPlan.hasMany(db.MonthlyPlan, { 
  foreignKey: 'yearlyPlanId', // 복합 키의 경우 실제 쿼리 시 crewId 매핑도 확인 필요
  ...cascadeOptions 
});

// Date 기반 관계
db.Date.hasMany(db.ToDo, { foreignKey: 'dateId', ...cascadeOptions });
db.Date.hasMany(db.DateMemo, { foreignKey: 'dateId', ...cascadeOptions });

// ToDo -> TodoMemo
db.ToDo.hasMany(db.TodoMemo, { foreignKey: 'toDoId', ...cascadeOptions });

// Frequency -> List
db.Frequency.hasMany(db.List, { foreignKey: 'frequencyId', ...cascadeOptions });

// belongsTo 설정 (역방향)
db.YearlyPlan.belongsTo(db.Crew, { foreignKey: 'crewId' });
db.MonthlyPlan.belongsTo(db.YearlyPlan, { foreignKey: 'yearlyPlanId' });
db.Goal.belongsTo(db.Crew, { foreignKey: 'crewId' });
db.Date.belongsTo(db.Crew, { foreignKey: 'crewId' });
db.ToDo.belongsTo(db.Date, { foreignKey: 'dateId' });
db.TodoMemo.belongsTo(db.ToDo, { foreignKey: 'toDoId' });
db.DateMemo.belongsTo(db.Date, { foreignKey: 'dateId' });
db.Frequency.belongsTo(db.Crew, { foreignKey: 'crewId' });
db.List.belongsTo(db.Frequency, { foreignKey: 'frequencyId' });
db.Event.belongsTo(db.Crew, { foreignKey: 'crewId' });

module.exports = db;