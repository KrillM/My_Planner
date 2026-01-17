const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('YearlyPlan', {
    yearlyPlanId: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    year: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.STRING(200), allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'yearlyPlan', timestamps: false });
};