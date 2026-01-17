const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('TodoMemo', {
    todoMemoId: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    toDoId: { type: DataTypes.BIGINT, primaryKey: true },
    dateId: { type: DataTypes.BIGINT, primaryKey: true },
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'todoMemo', timestamps: false });
};