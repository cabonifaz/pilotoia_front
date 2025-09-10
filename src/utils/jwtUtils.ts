interface JWTPayload {
  ID_USUARIO: number;
  USUARIO: string;
  NOMBRES: string;
  APELLIDOS: string;
  ID_TIPO_ROL: number;
  STRING1: string; // role name
  company_areas: Array<{
    ID_EMPRESA: number;
    EMPRESA: string;
    ID_AREA: number;
    AREA: string;
  }>;
  exp: number;
  iat: number;
  iss: string;
}

export interface DecodedUserData {
  user_id: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  id_tipo_rol: number;
  rol_nombre: string;
  company_areas: Array<{
    ID_EMPRESA: number;
    EMPRESA: string;
    ID_AREA: number;
    AREA: string;
  }>;
  status: string;
}

class JWTUtils {
  private static base64UrlDecode(str: string): string {
    // Convert base64url to base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' if needed
    while (str.length % 4) {
      str += '=';
    }
    // Decode base64
    return atob(str);
  }

  static decodeToken(token: string): DecodedUserData | null {
    try {
      // Split the token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Decode the payload (second part)
      const payload = JSON.parse(this.base64UrlDecode(parts[1])) as JWTPayload;
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.warn('JWT token is expired');
        return null;
      }
      
      // Transform JWT payload to LoginResponse format
      return {
        user_id: payload.ID_USUARIO,
        usuario: payload.USUARIO,
        nombres: payload.NOMBRES,
        apellidos: payload.APELLIDOS,
        id_tipo_rol: payload.ID_TIPO_ROL,
        rol_nombre: payload.STRING1,
        company_areas: payload.company_areas || [],
        status: 'success'
      };
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  static isTokenValid(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      return decoded !== null;
    } catch (error) {
      return false;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(this.base64UrlDecode(parts[1])) as JWTPayload;
      const now = Math.floor(Date.now() / 1000);
      return payload.exp ? payload.exp < now : false;
    } catch (error) {
      return true;
    }
  }

  static getTokenExpiration(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(this.base64UrlDecode(parts[1])) as JWTPayload;
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }
}

export default JWTUtils;