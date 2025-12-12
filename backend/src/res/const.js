require("dotenv").config();

class Const {
  static urlSWG_UAT = process.env.API_URL_UAT;
  static keySWG_UAT = process.env.API_KEY_UAT;
  static keySWG = process.env.API_KEY_PROD;
}

module.exports = Const;