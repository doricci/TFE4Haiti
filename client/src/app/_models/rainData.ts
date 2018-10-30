export class RainData {

  public id_station: string;
  public id_user: string;
  public date: Date;
  public value: number;


  public constructor(
  ) {
    this.date = new Date();
  }
}

export class RainDataAwaiting {
  public id_station: string;
  public id_user: string;
  public date: Date;
  public value: number;
  public type: string;


  public constructor(
  ) {
    this.date = new Date();
  }
}
