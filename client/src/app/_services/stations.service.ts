import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {User} from "../_models";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class StationsService {
  constructor(private http: HttpClient) {
  }

  getAll() {
    return this.http.get<any[]>(`${environment.apiUrl}/stations`);
  }

  getById(id: string) {
    return this.http.get(`${environment.apiUrl}/stations/` + id);
  }

  register(station) {
    return this.http.post(`${environment.apiUrl}/stations`, station);
  }

  update(station) {
    return this.http.put(`${environment.apiUrl}/stations/` + station._id, station);
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/stations/` + id);
  }
}
