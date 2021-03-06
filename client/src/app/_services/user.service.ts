﻿import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { User } from '../_models';
import { Observable } from 'rxjs';


@Injectable()
export class UserService {
  constructor(private http: HttpClient) {
  }

  getAll() {
    return this.http.get<User[]>(environment.apiUrl + '/users');
  }

  getWorkers() {
    return this.http.get<User[]>(environment.apiUrl + '/workers');
  }

  getAllAwaiting() {
    return this.http.get<User[]>(environment.apiUrl + '/users/getAllAwaiting');
  }

  getCountAllAwaiting() {
    return this.http.get<User[]>(environment.apiUrl + '/users/getCountAllAwaiting');
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(environment.apiUrl + '/users/' + id);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(environment.apiUrl + '/users/getUsers');
  }

  getRoles() {
    return this.http.get<string[]>(environment.apiUrl + '/users/roles');
  }

  register(user: User) {
    return this.http.post(environment.apiUrl + '/users', user);
  }

  acceptUser(id: String) {
    return this.http.post(environment.apiUrl + '/users/acceptUser/' + id, {});
  }

  refuseUser(id: String, reason: String) {
    return this.http.post(environment.apiUrl + '/users/refuse/' + id, { reason: reason });
  }

  update(user: User) {
    return this.http.put(environment.apiUrl + '/users/' + user._id, user);
  }

  delete(id: string) {
    return this.http.delete(environment.apiUrl + '/users/' + id);
  }

  requestChangePwd(mail: String) {
    return this.http.post(environment.apiUrl + '/users/askResetPwd', { mail: mail });
  }

  changePwd(pwd: String, pwdConf: String, url: String) {
    return this.http.post(environment.apiUrl + '/users/resetPwd', { pwd1: pwd, pwd2: pwdConf, urlReset: url });
  }

}
