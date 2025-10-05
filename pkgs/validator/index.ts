import * as v from "valibot"

const UNICODE_MAX = 0x10fffd
const HEX_PATTERN = /^[0-9a-f]{1,6}$/i

const unicode_schema = v.pipe(
    v.optional(v.pipe(v.string(), v.trim()), ""),
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
                return null
            }

            const numeric = parseInt(hex, 16)
            if (Number.isNaN(numeric) || numeric > UNICODE_MAX) {
                addIssue({
                    message: `Unicode ${part} out of range (<= U+10FFFD): ${value}`,
                })
                return null
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
                if (!start) return NEVER
                const end = parseCodepoint(endRaw, "end")
                if (!end) return NEVER

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
                message: `Unicode segment must be a single value or range: ${segment}`,
            })
            return NEVER
        }

        return normalised
    }),
)

const req_schema = v.object({
    files: v.pipe(
        v.array(
            v.pipe(
                v.file(),
                v.mimeType(["font/otf", "font/ttf", "font/woff", "font/woff2"]),
            ),
        ),
        v.minLength(1),
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
    ),
})

export const req_validator = v.safeParser(req_schema)
export const unicode_validator = v.safeParser(unicode_schema)
