import z from "zod"

const UNICODE_HEX_LIMIT = 0x10ffff
const single_hex_rgx = /^(?:0x|u\+)?[0-9a-fA-F]{1,6}$/i
const range_hex_rgx =
    /^(?:0x|u\+)?([0-9a-fA-F]{1,6})\s*-\s*(?:0x|u\+)?([0-9a-fA-F]{1,6})$/i

const unicodeItem = z
    .string()
    .trim()
    .refine(
        s => {
            if (single_hex_rgx.test(s)) {
                const v = parseInt(s.replace(/^(?:0x|u\+)/i, ""), 16)
                return v <= UNICODE_HEX_LIMIT
            }
            const m = s.match(range_hex_rgx)
            if (m) {
                if (!m[1] || !m[2]) return false
                const start = parseInt(m[1], 16)
                const end = parseInt(m[2], 16)
                return start <= end && end <= UNICODE_HEX_LIMIT
            }
            return false
        },
        {
            error: `Invalid unicode value. Use hex or hex range like
            "0041", "0x0041", "0041-005A", or "U+0041-005A" (max U+10FFFF).`,
        },
    )

export default z.object({
    file: z.file().mime(["font/otf", "font/ttf", "font/woff", "font/woff2"]),
    text: z.string().max(15_000).optional().default(""),
    unicodes: z.array(unicodeItem).optional().default([""]),
    output: z.enum(["ttf", "woff2"]),
})
