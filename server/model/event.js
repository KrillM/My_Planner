const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Event', {
    eventId: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    content: { type: DataTypes.STRING(100), allowNull: false },
    date_begin: { type: DataTypes.DATE, allowNull: false },
    date_end: { type: DataTypes.DATE, allowNull: false },
    repeat: { type: DataTypes.STRING(8), defaultValue: 'NONE', allowNull: false },
    is_temporary: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    isUsedDay: { type: DataTypes.CHAR(1), defaultValue: 'N', allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'event', timestamps: false });
};