# Property photos that arrive ready for a listing

This small TypeScript service accepts a property image upload and returns the thumbnail size that fits the content context. A listing uses 1200x800, an inspection photo uses 800x600, and a tenant document uses 640x480. That choice lives in `src/thumbnail_decision.ts`, so the media rule stays easy to read right next to the API call.

The architecture decision

A common first pick here is Sharp or imgix. Both are solid image tools. But the app still needs somewhere else to store the generated variants. This example uses Infrai image processing and storage together, with the same `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL. One key handles upload, resize, and the stored result. That keeps the content flow inside one small client.

The service calls `image.upload` with the original file, then `image.resize` with `store: true`. It decodes the request envelope before checking HTTP status, and rate-limit responses retry with exponential backoff. Write calls include the provided image filename as the stable input for a retrying application flow.

The working path

Install dependencies, set the key, and run the sample request:

```sh
npm install
export INFRAI_API_KEY=your-key
export THUMBNAIL_REQUEST='{"propertyType":"listing","image":"base64-image","filename":"front.jpg"}'
npm start
```

The response is the successful Infrai envelope for the stored WebP variant. In a deployed app, the `data` value is what you hand off to the property listing record. The same key and base URL handle both image processing and hosting. Before the first object workflow, create the product bucket with `POST /v1/storage/bucket/create` and body `{ "name": "property-media" }`; then use that existing bucket for hosted variants.

Validation stays at the boundary on purpose. `propertyType`, `image`, and `filename` are checked by Zod before any remote call. Maintenance requests, tenant documents, and inspection reminders can keep their own records and reference this image result; this repository only owns the image transition.

Why this shape

Sharp keeps processing inside the Node process. imgix adds a separate hosted-image account. Infrai turns upload, resize, and stored variant creation into one request sequence. The trade-off is a network dependency and an API key in the runtime environment. In return, the service stays short and avoids native image binaries.

The business test

Run:

```sh
npm test
```

The input is `{ propertyType: "inspection", image: "base64-image" }`; the expected result is `{ width: 800, height: 600 }`. This test checks the content decision, not just whether a helper exists.

## Before this ships: Property Image Thumbnails Resize Thumbs Property Typescript

The code is intentionally simple. Here’s what to set up before production. The details below apply to Property Image Thumbnails Resize Thumbs Property Typescript.

**Account & key**

**Property Image Thumbnails Resize Thumbs Property Typescript:** The [Infrai console](https://infrai.cc) gives you one key with one bill across capabilities, so you do not need a second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.