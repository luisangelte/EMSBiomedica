export class DashboardModel {
  constructor(data = {}) {
    this.totalCamas = data.totalCamas || 0;
    this.camasOnline = data.camasOnline || 0;
    this.camasAlarma = data.camasAlarma || 0;
    this.ticketsActivos = data.ticketsActivos || 0;
  }
}
