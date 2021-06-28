import { Router } from "cloudflare-router";
import config from "./config";
import * as uuid from "uuid";


declare global {
    const IMG_STORE: KVNamespace;
}


const router = new Router();
const api = new Router();

router.use("/api", api);


// Middleware to check auth
api.use("/*", (request, response, next) => {
    if (config.requireAuthKey) {
        if (!request.headers || !request.headers["x-auth-key"] || request.headers["x-auth-key"] !== config.authKey) {
            response
                .statusCode(401)
                .json({
                    success: false,
                    message: "No auth key was provided!"
                });
            
            return next!(false);
        }
    }
    
    // We'll let them pass and upload stuff
    next!();
});


// API for uploading the images
api.post("/upload", async (request, response) => {
    const GUIDName = uuid.v4();
    const imageType = request.headers["content-type"]?.includes("image/") ? request.headers["content-type"] : "image/png";
    
    const storeImgResult = await IMG_STORE.put(GUIDName, request.body as ReadableStream, {
        metadata: {
            imageType
        }
    })
        .then(() => true)
        .catch((e: Error) => e);
    
    if (storeImgResult instanceof Error) {
        return response
            .statusCode(500)
            .json({
                success: false,
                message: "An error occurred while attempting to save the requested data!",
                error: {
                    name: storeImgResult.name,
                    message: storeImgResult.message
                }
            });
    }
    
    // It was a success! Return the image link
    return response
        .statusCode(200)
        .json({
            success: true,
            imageLink: `${ config.domain }/img/${ GUIDName }`
        });
});

// Getting the image from its id
router.get("/img/:id", async (request, response) => {
    const foundEntry = await IMG_STORE.getWithMetadata(request.matchedParams!.id, "arrayBuffer");
    
    if (!foundEntry) {
        return response
            .statusCode(404)
            .text("404 nothing found :(");
    }
    
    return response
        .statusCode(200)
        .raw(
            foundEntry.value,
            (foundEntry.metadata as any).imageType!
        );
});

// Boilerplate :D
addEventListener("fetch", event => {
    event.respondWith(
        router.serveRequest(event.request, {})
            .then(built => built.response)
    );
});
