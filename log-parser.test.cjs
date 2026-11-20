"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseLog, decodeLog } = require("./log-parser.js");

test("raw client records use elapsed seconds and physical line numbers", () => {
  const text = "000000.000| ALWAYS| starting\r\nunrecognized\r\n\r\n000003.125|  WARN| detail\r\n";
  const r = parseLog(text);
  assert.deepEqual([r.lines, r.info, r.warnings, r.errors, r.unrecognized, r.blank], [4,1,1,0,1,1]);
  assert.deepEqual(r.entries, [{line:4, source:"Riot Client", time:"+000003.125 s", level:"warn"}]);
});

test("Unreal supports padded frames, header lines and implicit info", () => {
  const text = "LogInit: Display: startup\n[2026.01.02-03.04.05:006][ 42]LogNet: Error: private\nLogTemp: regular";
  const r = parseLog(text);
  assert.equal(r.sources.Unreal, 3);
  assert.equal(r.info, 2);
  assert.equal(r.errors, 1);
  assert.equal(r.entries[0].time, "2026.01.02-03.04.05:006");
  assert.ok(!JSON.stringify(r).includes("private"));
});

test("body text cannot inject or promote a severity", () => {
  const r = parseLog("000000.011| OKAY| ERROR in free text\nstack trace: Warning\nLogInit: message with Fatal: somewhere");
  assert.deepEqual([r.info, r.errors, r.warnings, r.unrecognized], [2,0,0,1]);
});

test("counts every issue while bounding the report and tolerating CR-only files", () => {
  const r = parseLog(Array(205).fill("000001.010| ERROR| example").join("\r"));
  assert.equal(r.errors, 205);
  assert.equal(r.entries.length, 200);
  assert.equal(r.entries.at(-1).line, 200);
  assert.equal(parseLog("").lines, 0);
});

test("decodes UTF-8 and BOM-marked UTF-16 and rejects invalid or binary text", () => {
  const line = "LogTemp: Warning: Tiếng Việt";
  assert.equal(decodeLog(Buffer.from("\uFEFF"+line)), line);
  const le = Buffer.from("\uFEFF"+line, "utf16le");
  assert.equal(decodeLog(le), line);
  assert.equal(decodeLog(Buffer.from(le).swap16()), line);
  assert.throws(() => decodeLog(Uint8Array.of(0x61,0xc3)));
  assert.throws(() => decodeLog(Uint8Array.of(0x61,0,0x62)));
});
