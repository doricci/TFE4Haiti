import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Note, Station } from '../_models';
import { Observable } from 'rxjs';
import { RainData } from "../_models/rainData";

@Injectable({
  providedIn: 'root'
})
export class StationsService {
  constructor(private http: HttpClient) {
  }

  getIntervals() {
    return this.http.get<any[]>(environment.apiUrl + '/stations/getInfo/intervals');
  }

  getCommunes() {
    return this.http.get<any[]>(environment.apiUrl + '/stations/getInfo/communes');
  }

  getRivers() {
    return this.http.get<any[]>(environment.apiUrl + '/stations/getInfo/rivers');
  }

  getAll() {
    return this.http.get<Station[]>(environment.apiUrl + '/stations');
  }

  getById(id: string): Observable<Station> {
    return this.http.get<Station>(environment.apiUrl + '/stations/' + id);
  }

  register(station: Station) {
    return this.http.post<Station>(environment.apiUrl + '/stations', station);
  }

  update(station) {
    return this.http.put(environment.apiUrl + '/stations/' + station._id, station);
  }

  addUser(stationId: string, userId: string) {
    return this.http.put(environment.apiUrl + '/stations/addUser/' + stationId, { user_id: userId });
  }

  removeUser(stationId: string, userId: string) {
    return this.http.put(environment.apiUrl + '/stations/removeUser/' + stationId, { user_id: userId });
  }

  delete(id: string) {
    return this.http.delete(environment.apiUrl + '/stations/' + id);
  }

  getAllAwaiting() {
    return this.http.get<Station[]>(environment.apiUrl + '/stations/getAllAwaiting');
  }


  getData(id_station: string, date: string) {
    return this.http.get<RainData[]>(environment.apiUrl + '/data/' + id_station + '/' + date);
  }






  /*
  acceptUser(id: String) {
    return this.http.post(environment.apiUrl + '/users/acceptUser', { id: id });
  }
  */
  acceptStation(id: String) {
    return this.http.post(environment.apiUrl + '/stations/acceptStation', { station_id: id });
  }

  getFrenchState(station: Station) {
    const french = {
      'working': 'Ok',
      'awaiting': 'A valider',
      'broken': 'En panne',
      'deleted': 'Supprimée'
    };
    return french[station.state];

  }

  importData(id: string, dataToSend: RainData[]) {
    return this.http.post(`${environment.apiUrl}/stations/${id}/import`, dataToSend);
  }

  importDataFile(id: string, file: FormData) {
    return this.http.post(`${environment.apiUrl}/stations/${id}/importFile`, file);
  }

  downloadData(id: string, param) {
    return this.http.get(environment.apiUrl + '/stations/' + id + '/download', { params: param });
  }

}
