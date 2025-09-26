import * as v from "valibot"
import { unicode_schema } from "./codepoints"

export const req_schema = v.object({
    file: v.pipe(
        v.instance(File),
        v.mimeType(["font/otf", "font/ttf", "font/woff", "font/woff2"]),
    ),
    text: v.optional(v.pipe(v.string(), v.maxLength(15_000)), ""),
    unicodes: unicode_schema,
    output: v.picklist(["ttf", "woff2"]),
})

export default v.safeParser(req_schema)
