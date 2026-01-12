const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Goal', {
    goalId: { type: DataTypes.STRING(40), primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    goal: { type: DataTypes.STRING(200), allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'goal', timestamps: false });
};