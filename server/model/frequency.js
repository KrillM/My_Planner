const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Frequency', {
    frequencyId: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'frequency', timestamps: false });
};