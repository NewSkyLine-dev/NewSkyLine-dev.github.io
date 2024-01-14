import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { WebUntis } from "webuntis";

const untis = new WebUntis(
    "htlwrn",
    "Oppermann.Fabian",
    "Birnenapfel-2006",
    "nete.webuntis.com"
);

const app = new Hono();

app.get("/", async (c) => {
    await untis.login();
    let today = new Date();
    const timetable = await untis.getOwnTimetableForRange(
        today,
        new Date(2024, 5, 1)
    );
    return c.json(timetable);
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});
