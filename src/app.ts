import { WebUntis } from "webuntis";
import { IExam, ILesson } from "./untis_utils/ints";
import { parseExams, parseTimetable } from "./untis_utils/data";
import { generateFileList } from "./html_gen/schema";
import * as fs from "fs";
import ical, { ICalCalendarMethod } from "ical-generator";
import { Client } from "@notionhq/client";
import * as icaltz from "@touch4it/ical-timezones";

const assigmentType: Record<string, string> = {
    Theorietest: "Theorietest 🙇🏻‍♂️",
    "Praktische Arbeit": "Praktische Arbeit 🧑🏻‍💻",
    Schularbeit: "Schularbeit 📝",
};

type SelectColor = "gray" | "blue" | "pink";

const assigmentColors: Record<string, SelectColor> = {
    Theorietest: "gray",
    "Praktische Arbeit": "blue",
    Schularbeit: "pink",
};

const untis = new WebUntis(
    process.env.SCHOOL as string,
    process.env.USERNAME as string,
    process.env.PASSWORD as string,
    process.env.SERVER as string
);

(async () => {
    // WebUntis
    await untis.login();

    const [timetable, exams] = await Promise.all([
        untis.getOwnTimetableForRange(
            new Date(2024, 0, 21),
            new Date(2024, 5, 27)
        ),
        untis.getExamsForRange(new Date(2024, 0, 21), new Date(2024, 5, 27)),
    ]);

    // Parse timetable and exams
    let timetable_events: ILesson[] = parseTimetable(timetable);
    const exams_events: IExam[] = parseExams(exams);

    // Check for duplicate events
    // timetable_events = checkDuplicateEvents(timetable_events, exams_events);

    // Create calendars
    const [timetable_calendar, exam_calendar] = [
        createCalendar("Stundenplan"),
        createCalendar("Exam"),
    ];

    // Timezones
    exam_calendar.timezone({
        name: "",
        generator: icaltz.getVtimezoneComponent,
    });

    timetable_calendar.timezone({
        name: "",
        generator: icaltz.getVtimezoneComponent,
    });

    // Add events to calendars
    await Promise.all([
        addEventsToCalendar(timetable_events, timetable_calendar),
        addEventsToCalendar(exams_events, exam_calendar),
    ]);

    // Write calendars to files
    await Promise.all([
        writeCalendarToFile(timetable_calendar, "Stundenplan/timetable.ics"),
        writeCalendarToFile(exam_calendar, "Exams/exams.ics"),
    ]);

    // Generate file list
    generateFileList();

    // Notion
    const notion: Client = new Client({
        auth: process.env.NOTION_TOKEN as string,
    });
    const database = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID as string,
    });

    // Create exams in Notion
    await createExamsInNotion(exams_events, database, notion);
})().catch(console.error);

function checkDuplicateEvents(
    timetable_events: ILesson[],
    exams_events: ILesson[]
) {
    return timetable_events.filter((timetable_event) => {
        return !exams_events.some((exam_event) => {
            return (
                timetable_event.startTime.getTime() ===
                    exam_event.startTime.getTime() &&
                timetable_event.endTime.getTime() ===
                    exam_event.endTime.getTime()
            );
        });
    });
}

function createCalendar(name: string) {
    return ical({
        name: name,
        method: ICalCalendarMethod.PUBLISH,
    });
}

function addEventsToCalendar(events: ILesson[], calendar: any) {
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
}

function writeCalendarToFile(calendar: any, filePath: string) {
    fs.mkdirSync(__dirname + "/" + filePath.split("/")[0], { recursive: true });
    fs.writeFileSync(__dirname + "/" + filePath, calendar.toString());
}

async function createExamsInNotion(
    exams_events: IExam[],
    database: any,
    notion: Client
) {
    const createPromises = [];
    const updatePromises = [];

    // Check for new exams
    for (const event of exams_events) {
        const examExists = database.results.some((page: any) => {
            const pageName = page.properties.Name?.title?.at(0)?.plain_text;
            const pageDate = page.properties.Datum?.date?.start;
            const pageType = page.properties.Testart?.select?.name;

            return (
                pageName === event.name &&
                pageDate === event.startTime.toISOString().split("T")[0] &&
                pageType === assigmentType[event.examType]
            );
        });

        if (!examExists) {
            createPromises.push(
                notion.pages.create({
                    parent: {
                        database_id: process.env.NOTION_DATABASE_ID as string,
                    },
                    properties: {
                        Name: {
                            type: "title",
                            title: [
                                {
                                    text: {
                                        content: event.name,
                                    },
                                },
                            ],
                        },
                        Testart: {
                            type: "select",
                            select: {
                                name: assigmentType[event.examType],
                                color: assigmentColors[event.examType],
                            },
                        },
                        Datum: {
                            type: "date",
                            date: {
                                start: event.startTime
                                    .toISOString()
                                    .split("T")[0],
                            },
                        },
                    },
                })
            );
        }
    }

    // Check for deleted exams
    for (const page of database.results) {
        const pageName = page.properties.Name?.title?.at(0)?.plain_text;
        const pageDate = page.properties.Datum?.date?.start;

        if (
            page.properties.Testart?.select?.name !== "Theorietest 🙇🏻‍♂️" &&
            page.properties.Testart?.select?.name !== "Praktische Arbeit 🧑🏻‍💻" &&
            page.properties.Testart?.select?.name !== "Schularbeit 📝"
        ) {
            continue;
        }

        const examExists = exams_events.some((event) => {
            return (
                pageName === event.name &&
                pageDate === event.startTime.toISOString().split("T")[0]
            );
        });

        if (!examExists) {
            updatePromises.push(
                notion.pages.update({
                    page_id: page.id,
                    archived: true,
                })
            );
        }
    }

    await Promise.all(createPromises);
    await Promise.all(updatePromises);
}
