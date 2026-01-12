const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ToDo', {
    toDoId: { type: DataTypes.STRING(40), primaryKey: true },
    dateId: { type: DataTypes.STRING(40), primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    content: { type: DataTypes.STRING(200), allowNull: false },
    planBegin: { type: DataTypes.DATE, allowNull: false },
    planEnd: { type: DataTypes.DATE, allowNull: false },
    isUseAlarm: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    isDone: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'toDo', timestamps: false });
};