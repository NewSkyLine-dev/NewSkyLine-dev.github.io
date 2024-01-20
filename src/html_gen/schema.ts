import * as fs from "fs";
import * as path from "path";

export function generateFileList() {
    const folderPath = path.join(__dirname, "../Stundenplan");
    const files = fs.readdirSync(folderPath);

    let html = "<ul>";
    files.forEach((file) => {
        const filePath = path.join("/Stundenplan", file);
        const fileLink = `<a href="${filePath}">${file}</a>`;
        html += `<li>${fileLink}</li>`;
    });
    html += "</ul>";

    fs.writeFileSync(__dirname + "/../fileList.html", html);
}
