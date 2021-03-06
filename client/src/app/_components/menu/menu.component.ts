import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../_services/menu.service';
import {NavigationStart, Router} from '@angular/router';
import { LocalstorageService } from '../../_services/localstorage.service';
import {AuthenticationService, DataService, StationsService, UserService} from '../../_services';
import { Constantes } from '../../_helpers/constantes';

import { forkJoin } from 'rxjs';



@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {


  public menu = { right: [], left: [] };
  numberToValidate;

  constructor(
    private menuService: MenuService,
    private router: Router,
    private localStorageService: LocalstorageService,
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private stationsService: StationsService,
    private dataService: DataService,
  ) {

  }

  getCounts() {
    return forkJoin(
      this.dataService.getStats(),
      this.userService.getCountAllAwaiting(),
      this.stationsService.getStats()
    );
  }

  ngOnInit() {
    this.menu.left = this.menuService.getMenuLeft();
    this.menu.right = this.menuService.getMenuRight();
    const self = this;
    this.localStorageService.storage$.subscribe(storage => {
      self.updateMenu(storage);
    });

    this.router.events.subscribe( e => {
      if (e.toString().includes('NavigationStart')) {
        this.getCounts().subscribe(result => {
          this.numberToValidate = Number(result[0].awaiting) + Number(result[1]) + Number(result[2].awaiting);
        });
      }
    });

    this.updateMenu(this.localStorageService.getStorage());
    this.authenticationService.isLogged().subscribe(
      value => {
        //console.log('val : ', value);
      },
      err => {
        //console.log('err', err);
      });
  }

  private updateMenu(storage) {
    const User = storage.currentUser;
    if (User && User.current) {
      let removelogin = true;
      const role = User.current.role;
      // console.log('role : ', role);
      switch (role) {
        case Constantes.roles.ADMIN:
          this.menu.left = this.menuService.getLeftAdminMenu();
          this.menu.right = this.menuService.getRightAdminMenu();
          break;
        case Constantes.roles.WORKER:
          this.menu.left = this.menuService.getleftWorkerMenu();
          this.menu.right = this.menuService.getRightWorkerMenu();
          break;
        case Constantes.roles.VIEWER:
          this.menu.left = this.menuService.getLeftViewerMenu();
          this.menu.right = this.menuService.getRightViewerMenu();
          break;
        default:
          removelogin = false;
          this.menu.left = this.menuService.getMenuLeft();
          this.menu.right = this.menuService.getMenuRight();
      }
      if (removelogin) {
        // Ne pas déplacer le login a une autre place que la premiere,
        // La recherche de l'objet contenant le login ne fonctionne pas pour une raison que j'ignore.
        this.menu.right.splice(0, 1);
      }
      this.menu.right = this.menu.right.reverse();
    } else {
      this.menu.left = this.menuService.getMenuLeft();
      this.menu.right = this.menuService.getMenuRight();
    }
    // console.log('menuleft = ', this.menu.left);
    // console.log('menuRight = ', this.menu.right);
  }
  itemClick(path) {
    if (path === 'logout') {
      this.authenticationService.logout();
    }
    this.router.navigate([path]);
  }

}
