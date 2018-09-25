'use strict';
var config = require('./../modules/config');


var UsersModel = require('./../models/utilisateur');

module.exports = {
    login : function(user, res) {
        //TODO connect to mongodb
        res.status(200).send({message: "Method to implements"});
    },

    get : function(res) {
        UsersModel.UtilisateurModele.find({}).then(function (users) {
            res.status(200).send({message: users});
        })
        //TODO connect to mongodb

    },
    getById : function(id, res){
        //TODO connect to mongodb
        res.status(200).send({message: "Method to implements"});
    },
    getByEmail : function(email, res){
        //TODO connect to mongodb
        res.status(200).send({message: "Method to implements"});

    },
    create : function(user, res) {

        console.log(user);
        let uTmp = new UsersModel.UtilisateurModele();
        uTmp.mail = user.mail;
        uTmp.mdp = user.mdp;
        uTmp.type = 'admin';
        uTmp.save().then(() => {
            res.status(200).send({message: uTmp});
        })

    },

    update : function(user, res) {
        //TODO connect to mongodb
        res.status(200).send({message: "Method to implements"});
    },

    delete : function(email, res) {
        //TODO connect to mongodb
        res.status(200).send({message: "Method to implements"});
    }
};