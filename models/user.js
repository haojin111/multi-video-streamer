'use strict';
const crypto = require('crypto');
module.exports = (sequelize, DataTypes) => {
    class User extends sequelize.Model {
        // get validPassword(password) {
        //     var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`); 
        //     return this.hash === hash; 
        // }

        set setPassword(password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`);
            this.setDataValue('salt', salt);
            this.setDataValue('hash', hash);
        }
    }
    User.init({
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
              len: {
                args: [0, 50],
                msg: 'First name can contain till 50 letters'
              },
              isAlpha: true
            }
          },
          lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
              len: {
                args: [0, 100],
                msg: 'Last name can contain till 100 letters'
              },
              isAlpha: true
            }
          },
          email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
              isEmail: {
                msg: 'Invalid email format.'
              }
            }
          },
        hash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, { sequelize });
    return User;
};