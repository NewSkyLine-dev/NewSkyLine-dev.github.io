import { WebUntis } from "webuntis";
import { ILesson } from "./untis_utils/ints";
import { parseExams, parseTimetable } from "./untis_utils/data";
import * as fs from "fs";
import { generateFileList } from "./html_gen/schema";
import ical, { ICalCalendarMethod } from "ical-generator";
import * as icaltz from "@touch4it/ical-timezones";

(async () => {
    const untis = new WebUntis(
        "htlwrn",
        "Oppermann.Fabian",
        "Birnenapfel-2006",
        "nete.webuntis.com"
    );

    await untis.login();

    const timetable = await untis.getOwnTimetableForRange(
        new Date(2024, 0, 21),
        new Date(2024, 5, 27)
    );

    const exams = await untis.getExamsForRange(
        new Date(2024, 0, 21),
        new Date(2024, 5, 27)
    );

    let timetable_events: ILesson[] = parseTimetable(timetable);
    let exams_events: ILesson[] = parseExams(exams);

    checkDuplicateEvents(timetable_events, exams_events);

    // Create calendars
    const timetable_calendar = ical({
        name: "Stundenplan",
        method: ICalCalendarMethod.PUBLISH,
    });

    const exam_calendar = ical({
        name: "Exam",
        method: ICalCalendarMethod.PUBLISH,
    });

    // Timezones
    exam_calendar.timezone({
        name: "",
        generator: icaltz.getVtimezoneComponent,
    });

    timetable_calendar.timezone({
        name: "",
        generator: icaltz.getVtimezoneComponent,
    });

    // Add events to calendar
    timetable_events.forEach((event) => {
        timetable_calendar.createEvent({
            start: event.startTime,
            end: event.endTime,
            summary: event.name,
            description: event.description,
            location: event.room,
            timezone: "Europe/Vienna",
        });
    });

    exams_events.forEach((event) => {
        exam_calendar.createEvent({
            start: event.startTime,
            end: event.endTime,
            summary: event.name,
            description: event.description,
            location: event.room,
            timezone: "Europe/Vienna",
        });
    });

    const value = timetable_calendar.toString();

    let timetable_ics_path = __dirname + "/Stundenplan";
    fs.mkdirSync(timetable_ics_path, { recursive: true });
    fs.writeFileSync(timetable_ics_path + "/timetable.ics", value as string);

    let exams_ics_path = __dirname + "/Exams";
    fs.mkdirSync(exams_ics_path, { recursive: true });
    fs.writeFileSync(exams_ics_path + "/exams.ics", exam_calendar.toString());

    generateFileList();
})().catch(console.error); // Catch any errors

function checkDuplicateEvents(
    timetable_events: ILesson[],
    exams_events: ILesson[]
) {
    // If there is a exam and a lesson at the same time, remove the lesson
    timetable_events.forEach((timetable_event, timetable_index) => {
        exams_events.forEach((exam_event) => {
            if (
                timetable_event.startTime.getTime() ==
                exam_event.startTime.getTime()
            ) {
                timetable_events.splice(timetable_index, 1);
            }
        });
    });
}
