const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MonthlyPlan', {
    monthlyPlanId: { type: DataTypes.STRING(40), primaryKey: true },
    yearlyPlanId: { type: DataTypes.STRING(40), primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.STRING(200), allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'monthlyPlan', timestamps: false });
};