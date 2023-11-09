/////////////////////////////////////////////////////////////////////
// Use this class to insert into middlewares into the pipeline
// 
/////////////////////////////////////////////////////////////////////
// Author : Nicolas Chourot
// Lionel-Groulx College
/////////////////////////////////////////////////////////////////////

import CachedRequestsManager from "./models/CachedRequestsManager.js";

export default class MiddlewaresPipeline {
    constructor() {
        this.middlewares = [];
    }
    add(middleware) {
        this.middlewares.push(middleware);
    }
    handleHttpRequest(HttpContext) {
        console.log("Attempting to fetch cached response...");
        const cachedRequestsResponse = CachedRequestsManager.get(HttpContext);
        console.log("Cached Response:", cachedRequestsResponse);

        if (cachedRequestsResponse) {
            console.log("Returning cached response...");
            return true;
        }
        for (let middleware of this.middlewares) {
            if (middleware(HttpContext)) 
                return true;
        }
        return false;
    }
}