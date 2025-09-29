export const select = <T = Element>(selector: string): T => {
    const el = document.querySelector(selector)
    if (!el) throw new Error("Element not found")
    return el as T
}

const formdata_maker = (object: Record<string, string | Blob | Blob[]>) => {
    const form = new FormData()

    for (const [key, val] of Object.entries(object)) {
        if (typeof val === "string" || val instanceof Blob) {
            form.append(key, val)
            continue
        }
        for (const item of Array.from(val)) form.append(key, item)
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
