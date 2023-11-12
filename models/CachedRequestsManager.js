import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";
import { v1 as uuidv1 } from "uuid";
import {log} from "../log.js";
let cachedRequestsExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

globalThis.CachedRequests = [];
globalThis.CachedRequestsEtags = {};
export default class CachedRequestsManager {
    static add(url, content, ETag = "") {
        if(url !== ""){
            CachedRequestsManager.clear(url);
            if(ETag === ""){
                //create etag
                ETag = uuidv1();
                CachedRequestsEtags[url] = ETag;
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
                    delete CachedRequestsEtags[endpoint.url];
                }
                index++;
            }
            utilities.deleteByIndex(CachedRequests, indexToDelete);
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
                        return cache;
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
        let url = HttpContext.req.url;
        const cache = CachedRequestsManager.find(url);
        if (cache) {
            console.log(`Extraction successful from cache with url : ${url}`);
            HttpContext.response.JSON(cache, cache.ETag, true);
            return true;
        } else {
            console.log(`Extraction not successful from cache with url : ${url}`);
            return false;
        }
    }
}
// periodic cleaning of expired cached repository data
setInterval(CachedRequestsManager.flushExpired, cachedRequestsExpirationTime * 1000);
log(BgWhite, FgBlack, "Periodic repository caches cleaning process started...");

