const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('List', {
    listId: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    frequencyId: { type: DataTypes.BIGINT, primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    content: { type: DataTypes.STRING(200), allowNull: false },
    isUseTimeSlot: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    planBegin: { type: DataTypes.DATE },
    planEnd: { type: DataTypes.DATE },
    isUseAlarm: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'list', timestamps: false });
};