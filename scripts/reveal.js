#!/usr/bin/env node
const fs = require("fs");

const VISIBLE = parseInt(process.env.VISIBLE || "2", 10);

const KEYFRAME =
  /@keyframes c(\d+)\{([\d.]+)%\{fill:var\(--(c\d)\)\}([\d.]+)%,100%\{fill:var\(--ce\)\}\}/g;

for (const file of process.argv.slice(2)) {
  let svg = fs.readFileSync(file, "utf8");

  const cells = [];
  for (const m of svg.matchAll(KEYFRAME)) {
    cells.push({ raw: m[0], id: m[1], eat: parseFloat(m[2]), eatEnd: m[4], color: m[3] });
  }

  if (cells.length === 0) {
    console.warn(`${file}: no animated cells found, leaving untouched`);
    continue;
  }

  cells.sort((a, b) => a.eat - b.eat);

  cells.forEach((cell, i) => {
    let replacement;
    let hiddenAtStart;

    if (i < VISIBLE) {
      replacement =
        `@keyframes c${cell.id}{0%,${cell.eat}%{fill:var(--${cell.color})}` +
        `${cell.eatEnd}%,100%{fill:var(--ce)}}`;
      hiddenAtStart = false;
    } else {
      const show = cells[i - VISIBLE].eatEnd;
      const hide = cells[i - VISIBLE].eat;
      replacement =
        `@keyframes c${cell.id}{0%,${hide}%{fill:var(--ce)}` +
        `${show}%,${cell.eat}%{fill:var(--${cell.color})}` +
        `${cell.eatEnd}%,100%{fill:var(--ce)}}`;
      hiddenAtStart = true;
    }

    svg = svg.replace(cell.raw, replacement);

    if (hiddenAtStart) {
      svg = svg.replace(
        `.c.c${cell.id}{fill:var(--${cell.color});animation-name:c${cell.id}}`,
        `.c.c${cell.id}{fill:var(--ce);animation-name:c${cell.id}}`
      );
    }
  });

  fs.writeFileSync(file, svg);
  console.log(`${file}: ${cells.length} dots rewritten, ${VISIBLE} visible at a time`);
}
