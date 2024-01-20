import { WebUntis } from "webuntis";
import { ILesson } from "./untis_utils/ints";
import { parseDate } from "./untis";
import { parseTimetable } from "./untis_utils/data";
import * as fs from "fs";
import * as ics from "ics";
import { generateFileList } from "./html_gen/schema";

(async () => {
    const untis = new WebUntis(
        "htlwrn",
        "Oppermann.Fabian",
        "Birnenapfel-2006",
        "nete.webuntis.com"
    );

    await untis.login();

    let events: ILesson[] = [];

    const timetable = await untis.getOwnTimetableForRange(
        new Date(),
        new Date(2024, 5, 27)
    );

    events = parseTimetable(timetable);

    // Write ics file
    let icsEvents: ics.EventAttributes[] = [];

    events.forEach((event) => {
        icsEvents.push({
            title: event.name,
            description: event.description as string,
            start: [
                event.startTime.getFullYear(),
                event.startTime.getMonth() + 1,
                event.startTime.getDate(),
                event.startTime.getHours(),
                event.startTime.getMinutes(),
            ],
            end: [
                event.endTime.getFullYear(),
                event.endTime.getMonth() + 1,
                event.endTime.getDate(),
                event.endTime.getHours(),
                event.endTime.getMinutes(),
            ],
            location: event.room,
        });
    });

    const { error, value } = ics.createEvents(icsEvents);

    if (error) {
        console.log(error);
    }

    let ics_path = __dirname + "/Stundenplan";
    fs.mkdirSync(ics_path, { recursive: true });
    fs.writeFileSync(ics_path + "/timetable.ics", value as string);

    generateFileList();
})().catch(console.error); // Catch any errors
