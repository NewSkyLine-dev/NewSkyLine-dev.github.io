import * as fs from "fs";
import * as path from "path";

export function generateFileList() {
    const timetablePath = path.join(__dirname, "../Stundenplan");
    const examsPath = path.join(__dirname, "../Exams");
    const examFiles = fs.readdirSync(examsPath);
    const timetableFiles = fs.readdirSync(timetablePath);

    let html = "<ul>";
    html += "<h1>Stundenplan</h1><hr>";
    timetableFiles.forEach((file) => {
        html += `<li><a href="./Stundenplan/${file}">${file}</a></li>`;
    });

    html += "<h1>Exams</h1><hr>";
    examFiles.forEach((file) => {
        html += `<li><a href="./Exams/${file}">${file}</a></li>`;
    });
    html += "</ul>";

    fs.writeFileSync(__dirname + "/../index.html", html);
}
