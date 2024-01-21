import { WebUntis } from "webuntis";
import { ILesson } from "./untis_utils/ints";
import { parseDate } from "./untis";
import { parseTimetable } from "./untis_utils/data";
import * as fs from "fs";
import { generateFileList } from "./html_gen/schema";
import ical, { ICalCalendarMethod } from "ical-generator";
import setZone, { DateTime } from "luxon";
import * as icaltz from "@touch4it/ical-timezones";

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
    const calendar = ical({
        name: "Stundenplan",
        method: ICalCalendarMethod.PUBLISH,
    });

    calendar.timezone({
        name: "" as string,
        generator: icaltz.getVtimezoneComponent,
    });

    events.forEach((event) => {
        calendar.createEvent({
            start: event.startTime,
            end: event.endTime,
            summary: event.name,
            description: event.description,
            location: event.room,
            timezone: "Europe/Vienna",
        });
    });

    const value = calendar.toString();

    let ics_path = __dirname + "/Stundenplan";
    fs.mkdirSync(ics_path, { recursive: true });
    fs.writeFileSync(ics_path + "/timetable.ics", value as string);

    generateFileList();
})().catch(console.error); // Catch any errors
