import { Exam, Lesson } from "webuntis";
import { IExam, ILesson } from "./ints";
import { parseDate } from "../untis";

function parseTimetable(data: Lesson[]): ILesson[] {
    let lessons: ILesson[] = [];

    // Check if all the data is there
    data.forEach((lesson) => {
        let room: string = "";
        let teacher: string = "";
        let subject: string = "";
        let start = new Date();
        let end = new Date();

        if (lesson.ro && lesson.ro.length > 0) {
            room = lesson.ro[0].name;
        }
        if (lesson.te && lesson.te.length > 0) {
            teacher = lesson.te[0].name;
        }
        if (lesson.su && lesson.su.length > 0) {
            subject = lesson.su[0].name;
        }
        if (lesson.startTime && lesson.endTime) {
            start = parseDate(lesson.date, lesson.startTime);
            end = parseDate(lesson.date, lesson.endTime);
        }

        if (lesson.code === "cancelled") {
            return;
        } else {
            lessons.push({
                name: subject,
                teacher: teacher,
                room: room,
                startTime: start,
                endTime: end,
                description: "",
            });
        }
    });

    return lessons;
}

function parseExams(data: Exam[]): IExam[] {
    let exams: IExam[] = [];

    data.forEach((exam: Exam) => {
        let room: string = "";
        let subject: string = "";
        let start = new Date();
        let end = new Date();
        let examType: string = "";

        if (exam.rooms && exam.rooms.length > 0) {
            room = exam.rooms[0];
        }
        if (exam.subject) {
            subject = exam.subject;
        }
        if (exam.startTime && exam.endTime) {
            start = parseDate(exam.examDate, exam.startTime);
            end = parseDate(exam.examDate, exam.endTime);
        }

        if (exam.examType) {
            examType = exam.examType;
        }

        exams.push({
            name: subject,
            teacher: "",
            room: room,
            startTime: start,
            endTime: end,
            description: "",
            examType: examType,
        });
    });

    return exams;
}

export { parseTimetable, parseExams };
