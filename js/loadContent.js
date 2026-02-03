// Email parts
const userRaw = "astroistra.pu"; // real user
const domain1 = "pu";
const domain2 = "t-com";
const tld = "hr";

// Phone parts
const phoneArea = "091";
const phoneMain = "214-1966";

// Build obfuscated display
const userObf = userRaw.replace(/\./g, " [dot] ");
const emailDisplay = `${userObf} [at] ${domain1} [dot] ${domain2} [dot] ${tld}`;
const emailLink = `${userRaw}@${domain1}.${domain2}.${tld}`;

const phoneDisplay = `${phoneArea} / ${phoneMain}`;
const phoneLink = `${phoneArea}${phoneMain.replace(/-/g, "")}`;

// Build HTML
const html = `
      <strong>Astronomsko društvo "Istra"</strong><br>
      Dio Zajednice tehničke kulture Pula (Glavinićev uspon 1, Pula)<br>
      e-mail: <a href="mailto:${emailLink}">${emailDisplay}</a> |
      tel. <a href="tel:${phoneLink}">${phoneDisplay}</a><br>
      (Zvjezdarnica, Park Monte Zaro 2, Pula)
  `;

document.querySelector("footer").innerHTML = html;
