import * as v from "valibot"

const UNICODE_MAX = 0x10fffd
const HEX_PATTERN = /^[0-9a-f]{1,6}$/i

export const unicode_schema = v.pipe(
    v.optional(v.pipe(v.string(), v.trim()), ""),
    v.rawTransform(({ dataset, addIssue, NEVER }) => {
        if (!dataset.typed) return NEVER

        const raw = dataset.value
        if (raw === "") return []

        const segments = raw
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
        const formatCodepoint = (value: number) => `U+${toHex(value)}`

        const parseCodepoint = (
            value: string,
            {
                allowPrefix,
                part,
            }: { allowPrefix: boolean; part: "single" | "start" | "end" },
        ) => {
            const hasPrefix = /^u\+/i.test(value)
            if (hasPrefix && !allowPrefix) {
                addIssue({
                    message: `Range end cannot include "U+" prefix: ${value}`,
                })
                return null
            }

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
                const parsed = parseCodepoint(single, {
                    allowPrefix: true,
                    part: "single",
                })
                if (!parsed) return NEVER
                normalised.push(formatCodepoint(parsed.numeric))
                continue
            }

            if (parts.length === 2) {
                const [startRaw, endRaw] = parts as [string, string]
                const start = parseCodepoint(startRaw, {
                    allowPrefix: true,
                    part: "start",
                })
                if (!start) return NEVER

                const end = parseCodepoint(endRaw, {
                    allowPrefix: false,
                    part: "end",
                })
                if (!end) return NEVER

                if (start.numeric > end.numeric) {
                    addIssue({
                        message: `Unicode range start must be <= end: ${segment}`,
                    })
                    return NEVER
                }

                normalised.push(`${formatCodepoint(start.numeric)}-${end.hex}`)
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

export default v.safeParser(unicode_schema)
