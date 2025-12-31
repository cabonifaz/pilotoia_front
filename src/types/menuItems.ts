export interface MenuItem {
  NUM1: number;           // Item ID
  NUM2: number;           // Display order
  NUM3: number;           // Max role allowed
  PATH: string;           // Route path
  LABEL: string;          // Display label
  ICON: string;           // Icon name (e.g., "MessageCircle")
}

export interface GetMenuItemsResponse {
  menu_items: MenuItem[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}