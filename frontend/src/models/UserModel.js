export class UserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usuario = data.usuario || '';
    this.nombre = data.nombre || '';
    this.rol = data.rol || 'Usuario';
    this.estado = data.estado || 'Activo';
  }
}
