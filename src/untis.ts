import { DateTime } from "luxon";

export function parseDate(date: number, time: number): Date {
    const year = Math.floor(date / 10000);
    const month = Math.floor((date % 10000) / 100);
    const day = date % 100;

    const hour = Math.floor(time / 100);
    const minute = time % 100;

    const viennaDateTime = DateTime.fromObject({
        year,
        month,
        day,
        hour,
        minute,
    }).setZone("Europe/Vienna");

    return viennaDateTime.toJSDate();
}
