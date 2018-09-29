'use strict';
var logger = require('../modules/logger');
var UsersModel = require('./../models/users');
const jwt = require('../modules/token');

module.exports = {
  login: function(user, res) {

    UsersModel.userModel.findOne({ mail: user.mail, pwd: user.pwd }, function(err, result) {
      if (err) {
        res.status(404).send({ error: err });
      } else {
        var token = jwt.createToken(result);
        res.status(200).send({current: result.toDto(), token: token });
      }
    })
  },

  get: function(res) {
    UsersModel.userModel.find({}).then(function(users) {
      let tabU = [];
      users.forEach(user => tabU.push(user.toDto()));
      res.status(200).send({ message: tabU });
    })
  },
  getById: function(id, res) {
    //TODO connect to mongodb
    res.status(200).send({ message: "Method to implements" });
  },
  getByEmail: function(email, res) {
    //TODO connect to mongodb
    res.status(200).send({ message: "Method to implements" });

  },
  create: function(user, res) {
    let uTmp = new UsersModel.userModel();
    uTmp.mail = user.mail;
    uTmp.pwd = user.pwd;
    uTmp.type = user.type;
    uTmp.save().then(() => {
      res.status(200).send({ message: uTmp.toDto() });
    })

  },

  update: function(user, res) {
    //TODO connect to mongodb
    res.status(200).send({ message: "Method to implements" });
  },

  delete: function(email, res) {
    //TODO connect to mongodb
    res.status(200).send({ message: "Method to implements" });
  }
};