import { WebUntis } from "webuntis";
import { ILesson } from "./untis_utils/ints";
import { parseDate } from "./untis";
import { parseTimetable } from "./untis_utils/data";
import * as fs from "fs";
import * as ics from "ics";
import { generateFileList } from "./html_gen/schema";
import { DateTime } from "luxon";

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
        const startTime = DateTime.fromJSDate(event.startTime).setZone(
            "Europe/Vienna"
        );
        const endTime = DateTime.fromJSDate(event.endTime).setZone(
            "Europe/Vienna"
        );

        icsEvents.push({
            title: event.name,
            description: event.description as string,
            start: [
                startTime.year,
                startTime.month,
                startTime.day,
                startTime.hour,
                startTime.minute,
            ],
            end: [
                endTime.year,
                endTime.month,
                endTime.day,
                endTime.hour,
                endTime.minute,
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
