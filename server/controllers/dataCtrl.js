const path = require('path');
const fs = require('fs');

const formidable = require('formidable');
const logger = require('../config/logger');
const dataModel = require('./../models/data');
const checkParam = require('./utils').checkParam;
const state = require('../config/constants').DataType;

const Station = require("../models/station");
const UsersModel = require("../models/users");
const roles = require('../config/constants').roles;


/*
 * Méthode utilisée pour insérer des données en base de donnée
 * @param {number[]} dates Tableau des données devant être inséérer en base de données
 * @param {Station} station Station pour laquelle il faut insérer les données
 * @param {string} user L'id de l'utilisateur ayant inséré les données
 * ? Besoin d'un autre paramètre ?
 */
insertData = function(req, res, datas, station, user) {
  // Vérifier que l'utilisateur peut insérer sur cette station

  if (station.users.indexOf(user._id) < 0 && user.role !== roles.ADMIN) {
    res.status(403).send(`Vous n'avez pas accès à la modification de cette station`);
  } else {

    // Vérifier les données en fonction de l'intervalle de la Station (que l'intervalle soit respectée) si intervalle <1h

    // inserer donnée une à une
    // Si intervalle >1h vérifier l'intégrité des données ?!

    // ? si collision dans la date ?

    // Va falloir utiliser Promise.all(les promesses).then etc : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all

    // console.log("Data to insert : ", datas);
    dataModel.RainDataAwaitingModel.insertMany(datas, (err, docs) => {
      // console.log(err);
      // console.log(docs);
      if (err) {
        // console.log('erreur : ', err);

        res.status(500).send(err); //'Les données n\'ont pas sur être insérer...');
      } else {
        res.status(200).send();
      }
    })

  }
};
exports.getAwaiting = function(req, res) {
  dataModel.RainDataAwaitingModel.find({}, (err, datas) => {
    if (err) {
      logger.error("[DATACTRL] getAwaiting : ", err);
      return res.status(500).send("Erreur lors de la reucpérations des données.")
    } else {
      return res.status(200).send(datas);
    }
  });
};


exports.acceptAwaiting = function(req, res) {
  checkParam(req, res, ["id"], function() {
    let id = req.body.id;
    console.log(id);
    dataModel.RainDataAwaitingModel.findById(id, (err, rainDataAwaiting) => {
      if (err) {
        logger.error("[DATACTRL] acceptAwaiting : ", err)
        return res.status(500).send("Erreur lors de la recupération de la donnée.")
      } else {
        let status = 200;
        switch (rainDataAwaiting.type) {
          case state.INDIVIDUAL:
            const rainData = dataModel.RainDataAwaitinToAccepted(rainDataAwaiting);
            rainData.save().then(() => {
              dataModel.RainDataAwaitingModel.deleteOne({ _id: rainDataAwaiting._id }).then(() => {
                res.status(200).send()
              });

            });
            return;
          case state.UPDATE:
            return;
          case state.FILE:
            fs.readFile(rainDataAwaiting.value, 'utf-8', (err, fileData) => {
              if (err) {
                res.status(500).send("Le fichier n'a pas pu etre lu.")
              }

              Station.stationModel.findById({ _id: rainDataAwaiting.id_station }, (err, station) => {
                if (err) {
                  logger.error(err);
                  res.status(500).send(`erreur lors de la recupération de la station ${rainDataAwaiting.id_station}`)
                } else {
                  // console.log('[STATION] : ', station);
                  UsersModel.userModel.findById({ _id: rainDataAwaiting.id_user }, (err, user) => {
                    if (err) {
                      logger.error(err);
                      res.status(500).send(`erreur lors de la recupération de l'utilisateur ${rainDataAwaiting.id_user}`)
                    } else {
                      let datas = [];
                      let lines = fileData.split('\n');
                      // console.log(lines);
                      let prevDate = null;
                      let first = true;
                      for (var i = 0; i < lines.length; i++) {
                        var l = lines[i];
                        const d = l.split(';');
                        // console.log(d);
                        if (d.length > 1) {
                          let data = new dataModel.rainDataModel();
                          data.id_station = station._id;
                          data.id_user = user._id;
                          data.date = new Date(d[0]);
                          // console.log(data.date);
                          if (first) {
                            data.value = d[1].replace(',', '.');
                            datas.push(data);
                          } else {
                            if (checkDateInterval(prevDate, data.date, station.interval || true)) { //todo remove || true
                              data.value = d[1];
                              datas.push(data);
                            } else {
                              res.status(500).send("Les dates du fichier ne se suivent pas, ou ne corresponde pas à l'interval de la station..")
                              return;
                            }
                          }
                          prevDate = data.date;
                        }
                      }
                      // insertData(req, res, datas, station, user)
                      dataModel.rainDataModel.insertMany(datas, (err, docs) => {
                        // console.log(err);
                        // console.log(docs);
                        if (err) {
                          // console.log('erreur : ', err);

                          res.status(500).send(err); //'Les données n\'ont pas sur être insérer...');
                        } else {
                          fs.unlink(rainDataAwaiting.value, (err) => {
                            logger.error('[IMPORTFILE] remove : ', err);
                          });
                          dataModel.RainDataAwaitingModel.deleteOne({ _id: rainDataAwaiting._id }).then(() => {
                            res.status(200).send()
                          });
                        }
                      })
                    }

                  });
                }
              });

            });
            return;
          default:
            status = 500;
            break;

        }
        return res.status(status).send();
      }
    });
  });
};


exports.refuseAwaiting = function(req, res) {
  let id = req.params.id || '';
  if (!id) {
    return res.status(400).send("Information manquante(s)");
  }
  // console.log(id);
  dataModel.RainDataAwaitingModel.deleteOne({ _id: id }).then(() => {
    return res.status(204).send("ok") //TODO remove body
  }).catch(function(err) {
    logger.error(err);
    return res.status(500).send("Erreur lors du refus de la donnée.");
  });
};

exports.get = function(req, res) {
  dataModel.rainDataModel.find({ id_station: req.params.stationId }, function(err, data) {
    if (err) {
      logger.error(err);
      return res.status(500).send("Erreur lors de la récupération des données.");
    }
    let tabD = [];
    data.forEach(data => tabD.push(data.toDto()));
    return res.status(200).send(tabD);
  });
};


exports.getRainDataGraphLine = function(req, res) {
  Station.stationModel.findById(req.params.stationId, (err, station) => {
    if (err) {
      return res.status(500).send("Erreur lors de la station liée .");
    }
    dataModel.rainDataModel.find({ id_station: req.params.stationId }, 'date value', { sort: { date: 1 } }, function(err, data) {
      if (err) {
        logger.error(err);
        return res.status(500).send("Erreur lors de la récupération des données.");
      }
      //preprocessData(data, req.params.stationId, station.interval);
      let tabD = [];
      data.forEach(data => tabD.push(dataModel.rainDataModel.toDtoGraphLine(data)));
      return res.status(200).send(tabD);
    });
  });
};


exports.getMonthly = function(req, res) {
  Station.stationModel.findById(req.params.stationId, (err, station) => {
    if (err) {
      return res.status(500).send("Erreur lors de la station liée .");
    }
    let year = req.params.year;
    let dateMin = new Date(Date.UTC(year, 0, 1, 12, 0, 0, 0));
    let dateMax = new Date(Date.UTC(year, 11, 31, 12, 0, 0, 0));

    console.log(dateMin);
    console.log(dateMax);

    dataModel.rainDataModel.find({
      id_station: req.params.stationId,
      date: { "$gte": dateMin, "$lt": dateMax }
    }, 'date value', { sort: { date: 1 } }, function(err, data) {
      if (err) {
        logger.error(err);
        return res.status(500).send("Erreur lors de la récupération des données.");
      }
      let mapValue = new Map();
      let i;
      for (i = 0; i < 12; i++) {
        mapValue.set(i, 0)
      }
      for (let i = 0; i < data.length - 1; i++) {
        let month = data[i].date.getMonth();
        let value = data[i].value;
        mapValue.set(month + 1, mapValue.get(month + 1) + value);
      }
      let tabD = [];
      for (i = 0; i < 12; i++) {
        let d;
        if (i === 11) {
          d = dateMax;
        } else {
          d = new Date(Date.UTC(year, i, 1, 12, 0, 0, 0));
        }
        let val = mapValue.get(i);
        if (val === 0)
          val = null;
        tabD.push(
          [
            d.valueOf(),
            val
          ]
        )
      }
      return res.status(200).send(tabD);
    });
  });
};


exports.getForDay = function(req, res) {
  let date = new Date(req.params.date);
  console.log(date);
  let dateMin = new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
  let dateMax = new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate());
  dateMax.setHours(dateMax.getHours() + 24);
  //console.log(dateMax);
  Station.stationModel.findById(req.params.stationId, (err, station) => {
    if (err) {
      return res.status(500).send("Erreur lors de la station liée .");
    }
    // TODO Tu peux sélectionner seulement les champs que t'as besoin. J'ai mis en com ce que j'ai changé avant le return.
    dataModel.rainDataModel.find({
      id_station: req.params.stationId,
      date: { "$gte": dateMin, "$lt": dateMax }
    }, ['_id', 'id_station', 'id_user', 'date', 'value'], { sort: { date: 1 } }, function(err, data) {
      if (err) {
        logger.error(err);
        return res.status(500).send("Erreur lors de la récupération des données.");
      }
      //let tabD = [];
      //data.forEach(data => tabD.push(data.toDto()));
      data = preprocessData(data, req.params.stationId, station.interval, dateMin, dateMax);
      return res.status(200).send(data);
    });
  });
};


// Cette méthode va remplir les trous de données potentiels en créant une structure de données avec la value à -1
// va entrer les données traitées dans le tableau : this.allDatas
function preprocessData(dataToProcess, stationId, interval, dateDebut, dateFin) {
  // Si pas de tableau ou tableau vide
  if (!dataToProcess || dataToProcess.length === 0) {
    return;
  }
  let hopSize = getIntervalInMinute(interval);

  let tabToReturn = [];
  let currDate = dateDebut;
  let idx = 0;
  let intervalInMs = hopSize * 60000;
  while (idx < dataToProcess.length && currDate < dateFin) {
    let currDateMilis = currDate.getTime();
    if (currDateMilis < dataToProcess[idx].date.getTime()) {
      let correctedDate = new Date(currDateMilis);
      let tmp = {};
      tmp.id_station = stationId;
      tmp.date = correctedDate;
      tabToReturn.push(tmp);
    } else {
      tabToReturn.push(dataToProcess[idx]);
      idx++;
    }
    currDate = new Date(currDateMilis + intervalInMs);
  }
  //While pour compléter la fin
  while (currDate < dateFin) {
    let currDateMilis = currDate.getTime();
    let correctedDate = new Date(currDateMilis);
    let tmp = {};
    tmp.id_station = stationId;
    tmp.date = correctedDate;
    tabToReturn.push(tmp);
    currDate = new Date(currDateMilis + intervalInMs);
  }
  return tabToReturn;
};

function minTwoDigits(n) {
  return (n < 10 ? '0' : '') + n;
}

function getIntervalInMinute(interval) {
  switch (interval) {
    case "1min":
      return 1;
    case "5min":
      return 5;
    case "10min":
      return 10;
    case "15min":
      return 15;
    case "30min":
      return 30;
    case '1h':
      return 60;
    case '2h':
      return 120;
    case '6h':
      return 360;
    case '12h':
      return 720;
    case '24h':
      return 1440;
    default:
      return -1;
  }
}


exports.importManualData = function(req, res) {
  const datas = req.body;
  const userId = req.token_decoded.id;
  const stationId = req.params.id || '';
  const self = this;

  // console.log('[USERID] ', req.token_decoded);

  let tmp = [];

  Station.stationModel.findById({ _id: stationId }, (err, station) => {
    if (err) {
      logger.error(err);
      res.status(500).send(`erreur lors de la récupération de la station ${stationId}`)
    } else {
      // console.log('[STATION] : ', station);
      UsersModel.userModel.findById({ _id: userId }, (err, user) => {
        if (err) {
          logger.error(err);
          res.status(500).send(`erreur lors de la récupération de l'utilisateur ${userId}`)
        } else {
          // console.log('[USER] : ', user);
          for (let i = 0; i < datas.length; i++) {
            const d = datas[i];
            let data = new dataModel.RainDataAwaitingModel();
            data.id_station = station._id;
            data.id_user = user._id;
            data.date = d.date;
            data.value = d.value;
            data.type = state.INDIVIDUAL;
            tmp.push(data);
            // console.log(data);
          }
          insertData(req, res, tmp, station, user);
        }
      });
    }
  });
};

exports.importFileData = function(req, res) {
  const pathDir = path.join(__dirname, '..', 'public', 'upload');
  if (!fs.existsSync(pathDir)) {
    fs.mkdirSync(pathDir);
    res.status(500).send("Veuillez réessyer d'importer le fichier.")
  } else {

    const userId = req.token_decoded.id;
    const stationId = req.params.id || '';
    const self = this;

    let form = new formidable.IncomingForm();
    form.uploadDir = pathDir;
    form.parse(req, function(err, fields, files) {
      // console.log(err);
      //       // console.log(fields);
      //       // console.log(files);
      const newPath = `${files['CsvFile'].path}-${files['CsvFile'].name}`
      fs.rename(files['CsvFile'].path, newPath, (err) => {

        if (err) {
          logger.error('[IMPORTFILE] Rename :  ', err);
          fs.unlink(files['CsvFile'].path, (err) => {
            logger.error('[IMPORTFILE] remove : ', err);
          });
          res.status(500).send("Le fichier n'a pas pu etre importé.");
        } else {

          let tmp = [];
          Station.stationModel.findById({ _id: stationId }, (err, station) => {
            if (err) {
              logger.error(err);
              res.status(500).send(`erreur lors de la récupération de la station ${stationId}`)
            } else {
              // console.log('[STATION] : ', station);
              UsersModel.userModel.findById({ _id: userId }, (err, user) => {
                if (err) {
                  logger.error(err);
                  res.status(500).send(`erreur lors de la récupération de l'utilisateur ${userId}`)
                } else {
                  // console.log('[USER] : ', user);


                  let data = new dataModel.RainDataAwaitingModel();
                  data.id_station = station._id;
                  data.id_user = user._id;
                  data.date = Date.now();
                  data.value = newPath;
                  data.type = state.FILE;
                  tmp.push(data);
                  // console.log(data);

                  insertData(req, res, tmp, station, user);
                }
              });
            }
          });

        }
      });

    })
  }


};

exports.updateData = function(req, res) {
  checkParam(req, res, ["id_curr_data"], function() {
    let id = req.body.id_curr_data;
    let data = req.body.data;
    if (data) {
      // Parse
      // Si c'est la même rien faire
    }
    // Si data == vide créer nvelle
    else {
      console.log("JE SUIS VIDE");
    }
    console.log(id);
    // Recup user via token


    return res.status(200).send();
  });
}

function checkDateInterval(date1, date2, interval) {
  if (!date1 || !date2 || !interval) {
    return false;
  }
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();
  var diff_ms = date2_ms - date1_ms;
  var interval_minute = getIntervalInMinute(interval);
  // console.log("Date1 : ", date1, " -> ", date1_ms);
  // console.log("Date2 : ", date2, " -> ", date2_ms);
  // console.log("Diff : ", diff_ms, " Interval : ", interval_minute);
  return ((diff_ms / 1000) / 60) == interval_minute;

}

//push();
/* Méthode utilisée pour tester en pushant des données dans base de données
 * En décommentant la ligne //push();
 * Une série de données va être envoyée en DB.
 */
function push() {
  const datas = [];
  const id_user = "5bbdb325d7aec61a195afc96";
  const id_station = "5bbf1bf686649912d4642b53";
  let ptr = 0;
  let intervalle = 1;
  for (let jour = 2; jour < 14; jour++) {
    for (let i = 2; i <= 25; i++) {
      for (let j = 0; j < 60; j += intervalle) {
        let item = {};
        item.id_station = id_station;
        item.id_user = id_user;

        let date2 = new Date(2018, 9, jour, i, j);
        item.date = date2;
        console.log(date2);
        item.value = getRandomInt(10);
        datas[ptr] = item;
        ptr++
      }
    }
  }
  let tmp = [];
  for (let i = 0; i < datas.length; i++) {
    let d = datas[i];
    let data = new dataModel.rainDataModel();
    data.id_station = d.id_station;
    data.id_user = d.id_user;
    data.date = d.date;
    data.value = d.value;
    tmp.push(data);
  }
  dataModel.rainDataModel.insertMany(tmp, (err, docs) => {
    console.log(err);
    console.log(docs);
    if (err) {
      //res.status(500).send('Les données n\'ont pas sur être insérer...');
    } else {
      //res.status(200).send();
    }
  });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


/*
 * Méthode utilisée pour vérifier que la date passée corresponde à l'intervalle donnée.
 * @param {string} interval L'intervalle de la id_station
 * @param {Date} date La date d'entrée de la donnée
 */
function isCorrect(interval, date) {
  // Intervalle existante : ['1min', '5min', '10min', '15min', '30min', '1h', '2h', '6h', '12h', '24h'];
  let val;
  switch (interval) {
    case '1mn':
      val = 60000;
      break;
    case '5mn':
      val = 300000;
      break;
    case '10mn':
      val = 600000;
      break;
    case '15mn':
      val = 900000;
      break;
    case '30mn':
      val = 1800000;
      break;
    default:
      console.log("NOT SUPPORTED TODO A TRAITER");
  }
  return date.getTime() % val === 0;
}