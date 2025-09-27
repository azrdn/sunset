export const select = <T = Element>(selector: string): T => {
    const el = document.querySelector(selector)
    if (!el) throw new Error("Element not found")
    return el as T
}

type FormValues = Record<string, string | string[] | Blob | Blob[] | FileList>
const formdata_maker = (object: FormValues) => {
    const form = new FormData()
    const entries = Object.entries(object)

    for (const [key, val] of entries) {
        if (typeof val === "string" || val instanceof Blob) {
            form.append(key, val)
            continue
        }
        const items = val instanceof FileList ? Array.from(val) : val
        for (const item of items) form.append(key, item)
    }
    return form
}

const download_response = async (resp: Response, fname: string, fmt: string) => {
    const blob = await resp.blob()
    const temp_url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = temp_url
    a.download = `${fname}.${fmt}`

    document.body.appendChild(a).click()
    URL.revokeObjectURL(temp_url)
    a.remove()
}

export { formdata_maker, download_response }