const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Date', {
    dateId: { type: DataTypes.STRING(40), primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    day: { type: DataTypes.INTEGER },
    month: { type: DataTypes.INTEGER },
    year: { type: DataTypes.INTEGER },
    isUsedDay: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    isTemporary: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'date', timestamps: false });
};