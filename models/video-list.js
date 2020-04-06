'use strict';
module.exports = (sequelize, DataTypes) => {
  class VideoLists extends sequelize.Model {}
  VideoLists.init({
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
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0
    }
  }, {
    sequelize
  });
  return VideoLists;
};