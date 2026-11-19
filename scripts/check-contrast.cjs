// WCAG contrast check for every color pair the site uses. Run with: npm run check:contrast
// Keep P in step with the variables in src/app/globals.css.
const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
const L=h=>{const n=parseInt(h.slice(1),16);return .2126*lin(n>>16&255)+.7152*lin(n>>8&255)+.0722*lin(n&255)};
const cr=(a,b)=>{const [x,y]=[L(a),L(b)].sort((p,q)=>q-p);return ((x+.05)/(y+.05)).toFixed(2)};
const P={paper:'#ffffff',surface:'#ffffff',soft:'#f6f7f9',ink:'#111827',muted:'#4b5563',blue:'#1d4ed8',blueDark:'#1e40af',blueTint:'#eaf1ff',amber:'#f59e0b',amberHover:'#e08e0b',amberTint:'#fef3c7',star:'#b45309',brick:'#b42318',brickDark:'#7a271a',brickTint:'#feeceb',lineStrong:'#858b94',white:'#ffffff'};
const pairs=[
  // Text on page surfaces.
  ['ink','paper',4.5],['ink','soft',4.5],['muted','paper',4.5],['muted','soft',4.5],
  // Text on tints.
  ['ink','blueTint',4.5],['muted','blueTint',4.5],['ink','amberTint',4.5],['muted','amberTint',4.5],['ink','brickTint',4.5],
  // Blue as text and links, and white on blue buttons.
  ['blue','paper',4.5],['blue','soft',4.5],['blue','blueTint',4.5],['blueDark','blueTint',4.5],['white','blue',4.5],['white','blueDark',4.5],
  // Amber is only ever a fill behind ink.
  ['ink','amber',4.5],['ink','amberHover',4.5],
  // Warnings.
  ['brick','surface',4.5],['brick','brickTint',4.5],['brickDark','brickTint',4.5],['brickDark','surface',4.5],
  // Non-text: input and button edges, stars, icons (WCAG 1.4.11).
  ['lineStrong','paper',3],['lineStrong','soft',3],['star','surface',3],['star','amberTint',3],['blue','surface',3],
];
let bad=0;for(const [a,b,min] of pairs){const r=+cr(P[a],P[b]);const ok=r>=min;if(!ok)bad++;console.log((ok?'ok  ':'FAIL'),a.padEnd(11),'on',b.padEnd(10),String(r).padStart(6),' need',min)}console.log('failures',bad);process.exit(bad?1:0);
