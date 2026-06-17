// Script de découpage des mosaïques humeur en 9 images individuelles
// Usage : node scripts/crop-humeur.js

const Jimp = require("jimp");
const path = require("path");
const fs = require("fs");

const INPUT_DIR = path.join(__dirname, "../public/humeur");
const OUTPUT_DIR = path.join(__dirname, "../public/humeur/sets");

// Chaque mosaïque est une grille 3x3 numérotée de gauche à droite, haut en bas.
// Pour les images avec des bordures épaisses, on peut affiner les offsets.
const SETS = [
  { name: "moutons",   file: "moutons.jpg",    label: "Moutons" },
  { name: "michael",   file: "michael.jpeg",   label: "Michael Scott" },
  { name: "michael2",  file: "michael-2.jpeg", label: "Michael Scott 2" },
  { name: "duck",      file: "duck.jpg",        label: "Canard" },
  { name: "jimcarrey", file: "jim-carrey.jpg",  label: "Jim Carrey" },
  { name: "loutre",    file: "loutre.jpeg",     label: "Loutres" },
  { name: "willsmith", file: "will-smith.jpg",  label: "Will Smith" },
  { name: "dory",      file: "dory.jpeg",       label: "Dory" },
];

async function cropSet(setConfig) {
  const { name, file, label } = setConfig;
  const inputPath = path.join(INPUT_DIR, file);

  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠️  Fichier introuvable : ${file}`);
    return;
  }

  const outputDir = path.join(OUTPUT_DIR, name);
  fs.mkdirSync(outputDir, { recursive: true });

  const image = await Jimp.read(inputPath);
  const W = image.bitmap.width;
  const H = image.bitmap.height;

  const cellW = Math.floor(W / 3);
  const cellH = Math.floor(H / 3);

  let index = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = col * cellW;
      const y = row * cellH;

      // Clone + crop + resize carrée à 400px
      const cell = image.clone().crop(x, y, cellW, cellH).resize(400, 400);

      const outPath = path.join(outputDir, `${index}.jpg`);
      await cell.quality(88).writeAsync(outPath);
      process.stdout.write(`  [${index}/9]\r`);
      index++;
    }
  }

  const sizes = fs.readdirSync(outputDir).map(f =>
    Math.round(fs.statSync(path.join(outputDir, f)).size / 1024) + "ko"
  );
  console.log(`✓ ${label.padEnd(20)} → 9 images  (${sizes.join(", ")})`);
}

async function main() {
  console.log(`\n🖼  Découpage des mosaïques humeur\n${"─".repeat(50)}`);
  for (const set of SETS) {
    await cropSet(set);
  }
  console.log(`\n✅ Terminé — images dans public/humeur/sets/\n`);
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
