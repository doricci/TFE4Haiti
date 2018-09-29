var mongoose = require('mongoose');
var config = require('./../modules/config');

// schema d'un utilisateur
var Schema = mongoose.Schema;
var User = new Schema({
  mail: { type: String, required: true },
  pwd: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
  type: { type: String, enum: ['admin', 'lamba'], required: true }
});


//Definition du modèle
var userModel = mongoose.model("user", User);

// Export du modèle
exports.userModel = userModel;

// TODO Si jamais j'ai des méthodes pour hash le pwd etc etc