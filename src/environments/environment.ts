import * as fs from 'fs';
import * as path from 'path';
import { config as configDotenv } from 'dotenv';

import { EnvironmentFile, Environments } from './environment.constant';
import IEnvironment from './environment.interface';

class Environment implements IEnvironment {

    public port: number;

    public secretKey: string;

    public applyEncryption: boolean;
  
    public relayerApiKey: string;
  
    public relayerSecretKey: string;

    constructor(NODE_ENV?: string) {
      const env: string= NODE_ENV || process.env.NODE_ENV || Environments.DEV;
      this.setEnvironment(env);
      const port: string | undefined | number = process.env.PORT || 3146;
      this.port = Number(port);
      this.applyEncryption = JSON.parse(process.env.APPLY_ENCRYPTION);
      this.secretKey =  process.env.SECRET_KEY;

      this.relayerApiKey = process.env.API_KEY;
      this.relayerSecretKey = process.env.API_SECRET;
    }

    public getCurrentEnvironment(): string {
      let environment: string = process.env.NODE_ENV || Environments.DEV;

      if (!environment) {
        environment = Environments.LOCAL;
      }
      switch (environment) {
        case Environments.PRODUCTION:
          return Environments.PRODUCTION;
        case Environments.DEV:
        case Environments.TEST:
        case Environments.QA:
          return Environments.TEST;
        case Environments.STAGING:
          return Environments.STAGING;
        case Environments.LOCAL:
        default:
          return Environments.LOCAL;
      }
    }

    public setEnvironment(env: string): void {
      let envPath: string;
      const rootdir : string = path.resolve(__dirname, '../../');
      switch (env) {
        case Environments.PRODUCTION:
          envPath = path.resolve(rootdir, EnvironmentFile.PRODUCTION);
          break;
        case Environments.TEST:
          envPath = path.resolve(rootdir, EnvironmentFile.TEST);
          break;
        case Environments.STAGING:
          envPath = path.resolve(rootdir, EnvironmentFile.STAGING);
          break;
        case Environments.LOCAL:
          envPath = path.resolve(rootdir, EnvironmentFile.LOCAL);
          break;
        default:
          envPath = path.resolve(rootdir, EnvironmentFile.LOCAL);
      }
      if (!fs.existsSync(envPath)) {
        configDotenv();
      } else {
        configDotenv({ path: envPath });
      }
    }

    public isProductionEnvironment(): boolean {
      return this.getCurrentEnvironment() === Environments.PRODUCTION;
    }

    public isDevEnvironment(): boolean {
      return this.getCurrentEnvironment() === Environments.DEV || this.getCurrentEnvironment() === Environments.LOCAL;
    }

    public isTestEnvironment(): boolean {
      return this.getCurrentEnvironment() === Environments.TEST;
    }

    public isStagingEnvironment(): boolean {
      return this.getCurrentEnvironment() === Environments.STAGING;
    }

}

export default Environment;
