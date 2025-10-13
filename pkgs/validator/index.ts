import * as v from "valibot"

const UNICODE_MAX = 0x10fffd
const HEX_PATTERN = /^[0-9a-f]{1,6}$/i
const SUBSET_OPTIONS = [
    "keep-everything",
    "no-hinting",
    "retain-gids",
    "desubroutine",
    "name-legacy",
    "set-overlaps-flag",
    "notdef-outline",
    "no-prune-unicode-ranges",
    "no-layout-closure",
    "no-bidi-closure",
    "glyph-names",
    "passthrough-tables",
    "preprocess",
    "optimize",
]
const MAGIC_BYTES = {
    TTF: [0x00, 0x01, 0x00, 0x00, 0x00],
    OTF: [0x4f, 0x54, 0x54, 0x4f],
    WOFF: [0x77, 0x4f, 0x46, 0x46],
    WOFF2: [0x77, 0x4f, 0x46, 0x32],
}

const file_schema = v.pipeAsync(
    v.file(),
    v.checkAsync(async file => {
        const file_bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer())
        const is_valid_font = Object.values(MAGIC_BYTES).some(signature =>
            signature.every((byte, index) => file_bytes[index] === byte),
        )
        return is_valid_font
    }, "File is not a valid font file"),
)

const unicode_schema = v.pipe(
    v.pipe(v.string(), v.trim()),
    v.rawTransform(({ dataset, addIssue, NEVER }) => {
        if (dataset.value === "") return []

        const segments = dataset.value
            .split(",")
            .map(segment => segment.trim())
            .filter(segment => segment.length > 0)
        if (segments.length === 0) {
            addIssue({
                message: "Unicode list must contain valid codepoints or ranges",
            })
            return NEVER
        }

        const toHex = (value: number) => value.toString(16).toUpperCase()
        const parseCodepoint = (value: string, part: "single" | "start" | "end") => {
            const hex = value.replace(/^u\+/i, "")
            if (!HEX_PATTERN.test(hex)) {
                addIssue({ message: `Invalid unicode ${part} value: ${value}` })
                return NEVER
            }

            const numeric = parseInt(hex, 16)
            if (Number.isNaN(numeric) || numeric > UNICODE_MAX) {
                addIssue({
                    message: `Unicode ${part} out of range (<= U+10FFFD): ${value}`,
                })
                return NEVER
            }

            return { numeric, hex: toHex(numeric) }
        }

        const normalised: string[] = []

        for (const segment of segments) {
            const parts = segment.split("-").map(part => part.trim())

            if (parts.some(part => part.length === 0)) {
                addIssue({ message: `Malformed unicode segment: ${segment}` })
                return NEVER
            }

            if (parts.length === 1) {
                const [single] = parts as [string]
                const parsed = parseCodepoint(single, "single")
                if (!parsed) return NEVER
                normalised.push(parsed.hex)
                continue
            }

            if (parts.length === 2) {
                const [startRaw, endRaw] = parts as [string, string]

                const start = parseCodepoint(startRaw, "start")
                const end = parseCodepoint(endRaw, "end")
                if (!end || !start) return NEVER

                if (start.numeric > end.numeric) {
                    addIssue({
                        message: `Unicode range start must be <= end: ${segment}`,
                    })
                    return NEVER
                }
                normalised.push(`${start.hex}-${end.hex}`)
                continue
            }

            addIssue({
                message: `Unicode segment must be single value or range: ${segment}`,
            })
            return NEVER
        }

        return normalised
    }),
)

const config_schema = v.object({
    text: v.optional(v.pipe(v.string(), v.maxLength(15_000)), ""),
    unicodes: v.optional(unicode_schema, ""),
    output: v.picklist(["ttf", "woff2"]),
    options: v.optional(
        v.pipe(
            v.array(v.string()),
            v.check(
                opts => opts.every(opt => SUBSET_OPTIONS.includes(opt)),
                "Options should only contain valid subset options",
            ),
        ),
        [],
    ),
})

const req_schema = v.objectAsync({
    files: v.pipeAsync(v.arrayAsync(file_schema), v.minLength(1)),
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
        config_schema,
    ),
})

export const request_parser = v.safeParserAsync(req_schema)
export const unicode_validator = v.safeParser(unicode_schema)
export const font_validator = v.safeParserAsync(file_schema)
