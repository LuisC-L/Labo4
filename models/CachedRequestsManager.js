import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import {log} from "../log.js";
let cachedRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

globalThis.CachedRequests = [];
export default class CachedRequestsManager {
    static add(url, content, ETag = "") {
        if(url !== ""){
            if(ETag === ""){
                //create etag
            }
            CachedRequests.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + cachedRequestsExpirationTime
            });
            console.log("Cache added for this URL : " + url);
        }
    }

    static clear(url) {
        if(url !== ""){
            let indexToDelete = [];
            let index = 0;
            for (let endpoint of CachedRequests) {
                // target all entries related to the same APIendpoint url base
                if (endpoint.url.toLowerCase().indexOf(url.toLowerCase()) > -1){
                    indexToDelete.push(index);
                }
                index++;
            }
            utilities.deleteByIndex(repositoryCaches, indexToDelete);
        }
    }

    static find(url) {
        try{
            if(url !== ""){
                for (let cache of CachedRequests) {
                    if (cache.url === url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + cachedRequestsExpirationTime;
                        console.log(`Data cached with ${url} retrieved from cached requests`);
                        return cache.content;
                    }
                }
            }
        } catch (error){
            console.log("cached requests error!", error);
        }
        return null;
    }

    static flushExpired() {
        let indexToDelete = [];
        let index = 0;
        let now = utilities.nowInSeconds();
        for (let cache of CachedRequests) {
            if (cache.Expire_Time < now) {
                console.log(`Cached ${cache.url} expired`);
                indexToDelete.push(index);
            }
            index++;
        }
        utilities.deleteByIndex(CachedRequests, indexToDelete);
    }

    static get(HttpContext) {
        const cache = this.find(HttpContext.req.url);
        if (cache) {
            console.log(`Extraction successful from cache with url : ${cache.url}`);
            HttpContext.response.JSON(cache, cache.ETag, true);
        } else {
            console.log(`Extraction not successful from cache with url : ${cache.url}`);
            HttpContext.response.JSON(cache);
        }
    }
}

