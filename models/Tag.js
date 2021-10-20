const { Model, DataTypes } = require('sequelize');

const sequelize = require('../config/connection.js');

const ProductTag = require('./ProductTag');

class Tag extends Model {}

Tag.init(
  {
    // define columns
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
     },
     tag_name: {
      type: DataTypes.STRING,
     },
  },
  {
    sequelize,
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    modelName: 'tag',
  }
);

module.exports = Tag;
