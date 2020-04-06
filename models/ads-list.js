'use strict';
module.exports = (sequelize, DataTypes) => {
  class AdsLists extends sequelize.Model {}
  AdsLists.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    time: {
      type: DataTypes.INTEGER,
      default: 30
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0
    }
  }, {
    sequelize
  });
  return AdsLists;
};