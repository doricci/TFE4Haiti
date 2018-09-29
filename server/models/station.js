var mongoose = require('mongoose');
var config = require('./../modules/config');

// schema pour récupérer un mot de passe
var Schema = mongoose.Schema;
var Station = new Schema({
  nom: { type: String, required: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  type: { type: String, enum: ['hydro', 'limni'], required: true },
  created_at: { type: Date, required: true, default: Date.now },
  derniere_utilisation: { type: Date },
  photo: { type: String }, // Url vers la photo
  utilisateurs: { type: [String], required: true },
  etat: { type: String, enum: ['attente', 'panne'], required: true }
});


//Definition du modèle
var stationModel = mongoose.model("station", Station);

// Export du modèle
exports.stationModel = stationModel;