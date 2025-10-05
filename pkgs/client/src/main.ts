import { unicode_validator } from "validator"
import * as util from "./utils"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4321"
const MAX_FILES_SIZE = parseInt(import.meta.env.VITE_MAX_REQ_SIZE || "20971520", 10)

const form = util.select<HTMLFormElement>("#form")
const fonts = util.select<HTMLInputElement>("#font-file")
const text = util.select<HTMLInputElement>("#subset-text")
const unicodes = util.select<HTMLTextAreaElement>("#unicodes")
const progress = util.select<HTMLProgressElement>("progress")
const submit_button = util.select<HTMLInputElement>("#submit")

unicodes.oninput = () => {
    const parsed = unicode_validator(unicodes.value)
    if (!parsed.success) unicodes.setCustomValidity(parsed.issues[0].message)
    else unicodes.setCustomValidity("")
    unicodes.reportValidity()
}

fonts.onchange = () => {
    let total_size = 0
    const msg = `Total file size cannot exceed ${util.format_bytes(MAX_FILES_SIZE)}`

    for (const file of fonts.files ?? []) total_size += file.size
    if (total_size > MAX_FILES_SIZE) fonts.setCustomValidity(msg)
    else fonts.setCustomValidity("")

    fonts.reportValidity()
}

const toggle_submitting = (is_submitting: boolean, text: string) => {
    submit_button.disabled = is_submitting
    submit_button.value = text
    if (is_submitting) progress.value = 0
    else progress.removeAttribute("value")
}

const append_error = (message: string) => {
    const node = document.createElement("p")
    node.className = "error"
    node.textContent = message || "An unexpected error occurred"
    form.appendChild(node)
}

const request_subset = (body: FormData, progress_el?: HTMLProgressElement) => {
    return new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", `${API_URL}/v1/subset`)
        xhr.responseType = "blob"

        if (progress_el) progress_el.value = 0
        xhr.upload.onprogress = event => {
            if (!event.lengthComputable || !progress_el) return
            progress_el.value = (event.loaded / event.total) * 100
        }
        xhr.onerror = () => reject(new Error("Network error"))
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const resp = util.convert_res(xhr)
                return resolve(resp)
            }
            const message = xhr.statusText || `Request failed, Error ${xhr.status}`
            reject(new Error(message))
        }
        xhr.send(body)
    })
}

const send_font = async () => {
    const output = util.select<HTMLInputElement>(".fmt:checked")
    const orig_text = submit_button.value

    document.querySelector(".error")?.remove()
    toggle_submitting(true, "Loading...")

    try {
        const response = await request_subset(
            util.formdata_maker({
                config: JSON.stringify({
                    text: text.value,
                    unicodes: unicodes.value,
                    output: output.value,
                }),
                files: fonts.files ? Array.from(fonts.files) : [],
            }),
            progress,
        )
        await util.download_res(response)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        append_error(message)
    } finally {
        toggle_submitting(false, orig_text)
    }
}

form.onsubmit = ev => {
    ev.preventDefault()
    send_font()
}
