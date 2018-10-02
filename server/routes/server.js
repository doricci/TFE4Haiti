// Modules node
const express = require('express');
var jsonwebtoken = require('jsonwebtoken');
var _ = require('underscore');
var nconf = require('nconf');

// Nos modules
var routesJs = require('./routes');
var routes = routesJs.routes;
var tokenManager = require('./../config/tokenManager');
var db = require("./../models/users")

// Applique les middleWare de vérification de sécurité
//  redirige selon le type de méthode
// Vérifie que le type de méthode existe (GET,POST, ...)
module.exports = function(app) {
  _.each(routes, function(route) {
    // Vérification des droits
    route.middleWare.unshift(ensureAuthorized);
    var args = _.flatten([route.path, route.middleWare]);

    // ToUpperCase au pour s'assurer que si qqun écrit get ça soit correct (GET normalement)
    switch (route.httpMethod.toUpperCase()) {
      case 'GET':
        app.get.apply(app, args);
        break;
      case 'POST':
        app.post.apply(app, args);
        break;
      case 'PUT':
        app.put.apply(app, args);
        break;
      case 'DELETE':
        app.delete.apply(app, args);
        break;
      default:
        throw new Error('Type de requête inconnue pour la route ' + route.path);
        break;
    }
  });
}

function ensureAuthorized(req, res, next) {
  // Si la route c'est /* tout le monde a accès
  if (req.route.path == "*") {
    return next();
  }
  // Check le token
  var token = tokenManager.validateToken(req, res, function() {
    // Ici on récup l'utilisateur
    var token = req.token_decoded;
    if (token && token.id) {
      // Check le droit de l'utiliasteur en le gettant dans la db (son id est dans le token)
      db.userModel.findOne({ _id: token.id }, function(err, user) {
        // Compare sa la personne a accès à la route, si non res.sendStatus(403);
        if (user) {
          var access = _.findWhere(routes, {
            path: req.route.path
          }).access;
          if (access.indexOf(user.type) > -1) {
            return next();
          } else {
            return res.sendStatus(403, "Non autorisé");
          }
        } else {
          return res.sendStatus(403, "Utilisateur inconnu");
        }
      });
    } else {
      return res.sendStatus(403, "Erreur lors de la validation du token");
    }
  });
}