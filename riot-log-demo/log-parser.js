"use strict";

const riotPrefix = /^\s*(\d{1,12}(?:\.\d{1,9})?)\s*\|\s*(ALWAYS|INFO|OKAY|WARN(?:ING)?|ERROR|FATAL|DEBUG|TRACE)\s*\|/i;
const unrealPrefix = /^(?:\[(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}\.\d{2}:\d{3})\]\s*(?:\[\s*\d+\]\s*)?)?(Log[A-Za-z0-9_]+):\s*(?:(Fatal|Error|Warning|Display|Log|Verbose|VeryVerbose):)?/i;
const reportLimit = 200;

function matchLogLine(line) {
  const riot = riotPrefix.exec(line);
  if (riot) return { source: "Riot Client", time: "+" + riot[1] + " s", level: riot[2].toLowerCase() };
  const unreal = unrealPrefix.exec(line);
  if (unreal) return { source: "Unreal", time: unreal[1] || null, level: (unreal[3] || "log").toLowerCase() };
  return null;
}

function parseLog(text) {
  const report = {
    lines: 0, blank: 0, unrecognized: 0, info: 0, warnings: 0, errors: 0,
    sources: { "Riot Client": 0, "Unreal": 0 }, limit: reportLimit, entries: []
  };
  const breaks = /\r\n|\n|\r/g;
  let start = 0;
  while (start < text.length) {
    const end = breaks.exec(text);
    const line = text.slice(start, end ? end.index : text.length);
    start = end ? breaks.lastIndex : text.length;
    report.lines++;
    if (!line.trim()) { report.blank++; continue; }
    const match = matchLogLine(line);
    if (!match) { report.unrecognized++; continue; }
    report.sources[match.source]++;
    if (match.level === "warn" || match.level === "warning") report.warnings++;
    else if (match.level === "error" || match.level === "fatal") report.errors++;
    else { report.info++; continue; }

    if (report.entries.length < reportLimit) {
      report.entries.push({ line: report.lines, ...match });
    }
  }
  return report;
}

function decodeLog(buffer) {
  const bytes = new Uint8Array(buffer);
  let encoding = "utf-8";
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  const text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  if (text.includes("\u0000")) throw new Error("Binary data");
  return text;
}

if (typeof module !== "undefined" && module.exports) module.exports = { parseLog, decodeLog };
