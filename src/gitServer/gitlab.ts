import { GitServer, IRequest } from "./gitServer";
import request from "request-promise-native";

class Gitlab extends GitServer implements IRequest {
  constructor() {
    super();
  }
  createMR(brach: string, name: string) {
    console.log(brach, name);
  }
  async getHttp(params: object) {
    return request({
      method: "GET",
      uri: "",
      body: params
    });
  }
  async postHttp(params: object) {
    return request({
      method: "POST",
      uri: "",
      body: params
    });
  }
}

export default Gitlab;
