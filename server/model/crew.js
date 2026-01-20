const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Crew', {
    crewId: { type: DataTypes.STRING(40), primaryKey: true },
    email: { type: DataTypes.STRING(100) },
    nickname: { type: DataTypes.STRING(50) },
    password: { type: DataTypes.STRING(600) },
    motto: { type: DataTypes.STRING(200) },
    profileImage: { type: DataTypes.STRING(600) },
    alarm: { type: DataTypes.DATE },
    resetPasswordToken: { type: DataTypes.STRING(600) },
    resetTokenExpires: { type: DataTypes.DATE },
    loginType: { type: DataTypes.STRING(10), defaultValue: 'MY_PLANNER', allowNull: false },
    creationTime: { type: DataTypes.DATE, allowNull: false },
    modifyTime: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'crew', timestamps: false });
};