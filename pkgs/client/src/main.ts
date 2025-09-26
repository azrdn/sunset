import validate_unicode from "validator/codepoints"

const API_URL = "http://localhost:4321"

const form = document.querySelector<HTMLFormElement>("#form")
const font_file = document.querySelector<HTMLInputElement>("#font-file")
const unicodes = document.querySelector<HTMLTextAreaElement>("#unicodes")
const submit_button = document.querySelector<HTMLInputElement>("#submit")
if (!form || !font_file || !unicodes || !submit_button) throw new Error()

unicodes.oninput = () => {
    const parsed = validate_unicode(unicodes.value)
    if (!parsed.success) unicodes.setCustomValidity(parsed.issues[0].message)
    else unicodes.setCustomValidity("")

    unicodes.reportValidity()
}

const download_response = async (resp: Response, fname: string, fmt: string) => {
    const blob = await resp.blob()
    const temp_url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = temp_url
    a.download = `${fname}.${fmt}`

    document.body.appendChild(a).click()
    a.remove()
    URL.revokeObjectURL(temp_url)
}

const send_font = async () => {
    const orig_text = submit_button.value

    document.querySelector(".error")?.remove()
    submit_button.disabled = true
    submit_button.value = "Loading..."

    try {
        const res = await fetch(`${API_URL}/v1/subset`, {
            method: "POST",
            body: new FormData(form),
        })
        if (!res.ok) throw new Error(res.statusText)
        if (!font_file.files) throw new Error()

        const filename = font_file.files.item(0)?.name.split(".")[0] ?? "font"
        const format = form.querySelector<HTMLInputElement>(".fmt:checked")
        if (!format) throw new Error()

        download_response(res, filename, format.value)
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
    if (unicodes.validity.valid) send_font()
}
