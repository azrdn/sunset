import validate_unicode from "validator/codepoints"
import { download_response, formdata_maker, select } from "./utils"

const API_URL = "http://localhost:4321"

const form = select<HTMLFormElement>("#form")
const font_file = select<HTMLInputElement>("#font-file")
const text = select<HTMLInputElement>("#subset-text")
const output = select<HTMLInputElement>(".fmt:checked")
const unicodes = select<HTMLTextAreaElement>("#unicodes")
const submit_button = select<HTMLInputElement>("#submit")

unicodes.oninput = () => {
    const parsed = validate_unicode(unicodes.value)
    if (!parsed.success) unicodes.setCustomValidity(parsed.issues[0].message)
    else unicodes.setCustomValidity("")
    unicodes.reportValidity()
}

const send_font = async () => {
    const orig_text = submit_button.value
    if (!font_file.files) throw new Error()

    document.querySelector(".error")?.remove()
    submit_button.disabled = true
    submit_button.value = "Loading..."

    try {
        const res = await fetch(`${API_URL}/v1/subset`, {
            method: "POST",
            body: formdata_maker({
                config: JSON.stringify({
                    text: text.value,
                    unicodes: unicodes.value,
                    output: output.value
                }),
                files: font_file.files,
            }),
        })
        if (!res.ok) throw new Error(res.statusText)
        if (!font_file.files) throw new Error()

        const filename = font_file.files[0]?.name.split(".")[0] ?? "font"
        download_response(res, filename, output.value)
    }
    catch (err) {
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
    if (unicodes.validity.valid) send_font()
}
