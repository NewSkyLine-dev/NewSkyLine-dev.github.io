export interface ILesson {
    name: string;
    teacher: string;
    room: string;
    startTime: Date;
    endTime: Date;
    description: string | null;
}
