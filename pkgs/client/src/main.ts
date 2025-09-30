import validate_unicode from "validator/codepoints"
import { download_res, format_bytes, formdata_maker, select } from "./utils"

const API_URL = "http://localhost:4321"
const MAX_FILES_SIZE = 20 * 1024 * 1024

const form = select<HTMLFormElement>("#form")
const fonts = select<HTMLInputElement>("#font-file")
const text = select<HTMLInputElement>("#subset-text")
const unicodes = select<HTMLTextAreaElement>("#unicodes")
const submit_button = select<HTMLInputElement>("#submit")

unicodes.oninput = () => {
    const parsed = validate_unicode(unicodes.value)
    if (!parsed.success) unicodes.setCustomValidity(parsed.issues[0].message)
    else unicodes.setCustomValidity("")
    unicodes.reportValidity()
}

fonts.onchange = () => {
    let total_size = 0
    const msg = `Total file size cannot exceed ${format_bytes(MAX_FILES_SIZE)}`

    for (const file of fonts.files ?? []) total_size += file.size
    if (total_size > MAX_FILES_SIZE) fonts.setCustomValidity(msg)
    else fonts.setCustomValidity("")

    fonts.reportValidity()
}

const send_font = async () => {
    const orig_text = submit_button.value

    document.querySelector(".error")?.remove()
    submit_button.disabled = true
    submit_button.value = "Loading..."

    try {
        const output = select<HTMLInputElement>(".fmt:checked")
        const res = await fetch(`${API_URL}/v1/subset`, {
            method: "POST",
            body: formdata_maker({
                config: JSON.stringify({
                    text: text.value,
                    unicodes: unicodes.value,
                    output: output.value,
                }),
                files: fonts.files as unknown as [],
            }),
        })
        if (!res.ok) throw new Error(res.statusText)
        if (!fonts.files) throw new Error()

        const filename = fonts.files[0]?.name.split(".")[0] ?? "font"
        download_res(res, filename, output.value)
    } catch (err) {
        if (!(err instanceof Error)) throw new Error("Wacky shit happened")

        const err_el = document.createElement("p")
        err_el.className = "error"
        err_el.textContent = `${err.message}`
        form.appendChild(err_el)
    }

    submit_button.disabled = false
    submit_button.value = orig_text
}

form.onsubmit = ev => {
    ev.preventDefault()
    send_font()
}
