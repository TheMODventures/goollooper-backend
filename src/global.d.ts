declare namespace Express {
  export interface Request {
    locals: {
      auth?: {
        userId: string;
        role: import("./database/interfaces/enums").EUserRole;
      };
    };
  }
}

interface ApiResponse {
  code: number;
  status: boolean;
  msg: string;
  data?: string | object | any;
  total?: number | null;
  accessToken?: string;
  refreshToken?: string;
}

interface JwtToken {
  accessToken: string;
  refreshToken: string;
}

interface IKeyValue {
  [key: string]: number | string;
}

interface ISortOption {
  [key: string]: import("mongoose").SortValues;
}
