interface ILesson {
    name: string;
    teacher: string;
    room: string;
    startTime: Date;
    endTime: Date;
    description?: string;
}

interface IExam extends ILesson {
    examType: string;
}

export { ILesson, IExam };
