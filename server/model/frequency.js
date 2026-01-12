const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Frequency', {
    frequencyId: { type: DataTypes.STRING(40), primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    frequencyTitle: { type: DataTypes.STRING(40), allowNull: false },
    schedule: { type: DataTypes.STRING(100) },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'frequency', timestamps: false });
};