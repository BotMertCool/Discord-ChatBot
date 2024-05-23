import { readFileSync } from "fs";

function getBlockedWords(severityCategory) {
    try {
        const csvData = readFileSync("./blockedwords.csv", "utf8");
        const rows = csvData.split("\n").slice(1);
        const wordsWithSeverity = rows
            .map((row) => {
                const columns = row.split(",");
                const word = columns[0].trim().toLowerCase();
                const severity = Number(columns[7].trim());
                return { word, severity };
            })
            .filter((entry) => entry.severity >= severityCategory);
        const filteredWords = wordsWithSeverity;
        return filteredWords;
    } catch (error) {
        console.log(error.message);
        return [];
    }
}

export { getBlockedWords };
