import * as v from "valibot"
import { unicode_schema } from "./codepoints"

const req_schema = v.object({
    files: v.array(
        v.pipe(
            v.file(),
            v.mimeType(["font/otf", "font/ttf", "font/woff", "font/woff2"]),
        ),
    ),
    config: v.pipe(
        v.string(),
        v.rawTransform(({ dataset, addIssue, NEVER }) => {
            try {
                return JSON.parse(dataset.value)
            } catch {
                addIssue({ message: "Config must be a valid JSON string" })
                return NEVER
            }
        }),
        v.object({
            text: v.optional(v.pipe(v.string(), v.maxLength(15_000)), ""),
            unicodes: unicode_schema,
            output: v.picklist(["ttf", "woff2"]),
        }),
    )
})

export default v.safeParser(req_schema)
