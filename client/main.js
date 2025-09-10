const API_URL = "<API URL HERE>";

/** @type { HTMLFormElement } */
const form = document.querySelector("#form");
/** @type { HTMLInputElement } */
const font_file = form.querySelector("#font-file");
/** @type { HTMLInputElement } */
const submit_button = form.querySelector('input[type="submit"]');

/**
 * @param {Response} resp
 * @param {string} filename
 * @param {string} format
 */
const download_response = async (resp, filename, format) => {
	const blob = await resp.blob();
	const temp_url = URL.createObjectURL(blob);
	const a = Object.assign(document.createElement("a"), {
		href: temp_url,
		download: `${filename}.${format}`,
	});
	document.body.appendChild(a).click();
	a.remove();
	URL.revokeObjectURL(temp_url);
};

const send_font = async () => {
	document.querySelector(".error")?.remove();
	submit_button.disabled = true;
	submit_button.value = "Loading...";

	try {
		const res = await fetch(API_URL, {
			method: "POST",
			body: new FormData(form),
		});
		if (!res.ok) throw new Error(res.statusText);

		const filename = font_file.files[0].name.split(".")[0] ?? "font";
		const format = document.querySelector('input[name="output"]:checked').value;
		download_response(res, filename, format);
	} catch (err) {
		form.appendChild(
			Object.assign(document.createElement("p"), {
				className: "error",
				textContent: err,
			}),
		);
	}

	submit_button.disabled = false;
	submit_button.value = "Subset";
};

form.onsubmit = (ev) => {
	ev.preventDefault();
	send_font();
};
