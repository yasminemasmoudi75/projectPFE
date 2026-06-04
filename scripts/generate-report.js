/**
 * Génère un rapport HTML style JUnit à partir du fichier junit.xml
 * Ouvre automatiquement le rapport dans le navigateur.
 */
const fs = require('fs');
const path = require('path');

const XML_PATH = path.join(__dirname, '../reports/junit.xml');
const HTML_PATH = path.join(__dirname, '../reports/junit-report.html');

if (!fs.existsSync(XML_PATH)) {
  console.error('❌ junit.xml introuvable. Lancez d\'abord: npm test');
  process.exit(1);
}

const xml = fs.readFileSync(XML_PATH, 'utf8');

// Parser XML simple (regex pour ne pas ajouter de dépendance)
const suites = [];
const suiteRegex = /<testsuite[^>]*name="([^"]*)"[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*time="([^"]*)"[^>]*>([\s\S]*?)<\/testsuite>/g;
const caseRegex = /<testcase[^>]*name="([^"]*)"[^>]*time="([^"]*)"[^>]*(?:\/>|>([\s\S]*?)<\/testcase>)/g;
const failureRegex = /<failure[^>]*message="([^"]*)"[^>]*>([\s\S]*?)<\/failure>/;

let suiteMatch;
while ((suiteMatch = suiteRegex.exec(xml)) !== null) {
  const [, name, tests, failures, time, body] = suiteMatch;
  const cases = [];
  let caseMatch;
  caseRegex.lastIndex = 0;
  while ((caseMatch = caseRegex.exec(body)) !== null) {
    const [, caseName, caseTime, caseBody] = caseMatch;
    const failMatch = caseBody ? failureRegex.exec(caseBody) : null;
    cases.push({
      name: caseName,
      time: parseFloat(caseTime || 0).toFixed(3),
      passed: !failMatch,
      failure: failMatch ? failMatch[1] : null,
    });
  }
  suites.push({ name, tests: parseInt(tests), failures: parseInt(failures), time, cases });
}

const totalTests = suites.reduce((s, t) => s + t.tests, 0);
const totalFailures = suites.reduce((s, t) => s + t.failures, 0);
const totalPassed = totalTests - totalFailures;
const allPassed = totalFailures === 0;
const barColor = allPassed ? '#4caf50' : '#f44336';
const barWidth = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

const suitesHtml = suites.map(suite => {
  const suitePassed = suite.failures === 0;
  const casesHtml = suite.cases.map(c => `
    <tr class="${c.passed ? 'pass' : 'fail'}">
      <td class="icon">${c.passed ? '✅' : '❌'}</td>
      <td class="test-name">${c.name}</td>
      <td class="time">${c.time}s</td>
      <td class="status">${c.passed ? 'PASSED' : 'FAILED'}</td>
      ${!c.passed ? `<td class="msg">${c.failure || ''}</td>` : '<td></td>'}
    </tr>`).join('');

  return `
  <div class="suite ${suitePassed ? 'suite-pass' : 'suite-fail'}">
    <div class="suite-header">
      <span class="suite-icon">${suitePassed ? '✅' : '❌'}</span>
      <span class="suite-name">${suite.name}</span>
      <span class="suite-meta">${suite.tests} test(s) — ${suite.failures} échec(s) — ${suite.time}s</span>
    </div>
    <table class="cases-table">
      <thead>
        <tr><th></th><th>Test</th><th>Durée</th><th>Statut</th><th>Message</th></tr>
      </thead>
      <tbody>${casesHtml}</tbody>
    </table>
  </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Tests — Nexus CRM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #333; }
    header { background: #1e3a5f; color: white; padding: 18px 30px; }
    header h1 { font-size: 1.4em; font-weight: 600; }
    header p  { font-size: 0.85em; opacity: 0.8; margin-top: 4px; }
    .summary { background: white; margin: 20px 30px 0; border-radius: 6px;
                padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    .summary h2 { font-size: 1em; color: #555; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px; }
    .progress-bar-bg { height: 22px; background: #f44336; border-radius: 4px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: #4caf50; width: ${barWidth}%;
                          transition: width .5s; display: flex; align-items: center;
                          padding-left: 8px; color: white; font-size: 0.78em; font-weight: 600; }
    .stats { display: flex; gap: 30px; margin-top: 14px; }
    .stat { text-align: center; }
    .stat-num { font-size: 2em; font-weight: 700; }
    .stat-label { font-size: 0.78em; color: #777; text-transform: uppercase; }
    .green { color: #4caf50; } .red { color: #f44336; } .blue { color: #1565c0; }
    .content { margin: 16px 30px 30px; }
    .suite { background: white; border-radius: 6px; margin-bottom: 14px;
              box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden; }
    .suite-header { display: flex; align-items: center; gap: 10px; padding: 12px 16px;
                     border-left: 5px solid #4caf50; background: #f9fff9; }
    .suite-fail .suite-header { border-left-color: #f44336; background: #fff9f9; }
    .suite-icon { font-size: 1.1em; }
    .suite-name { font-weight: 600; flex: 1; }
    .suite-meta { font-size: 0.82em; color: #777; }
    .cases-table { width: 100%; border-collapse: collapse; font-size: 0.88em; }
    .cases-table thead tr { background: #f0f0f0; }
    .cases-table th { padding: 8px 12px; text-align: left; font-weight: 600; color: #555; }
    .cases-table td { padding: 8px 12px; border-top: 1px solid #f0f0f0; }
    .cases-table .pass td { background: #fafffa; }
    .cases-table .fail td { background: #fff5f5; }
    .icon { width: 28px; text-align: center; }
    .time { color: #777; width: 80px; }
    .status { width: 90px; font-weight: 600; }
    .pass .status { color: #388e3c; }
    .fail .status { color: #c62828; }
    .msg { color: #b71c1c; font-size: 0.85em; max-width: 350px; word-break: break-word; }
    footer { text-align: center; padding: 16px; font-size: 0.8em; color: #aaa; }
  </style>
</head>
<body>
  <header>
    <h1>Rapport de Tests — Nexus CRM</h1>
    <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
  </header>

  <div class="summary">
    <h2>Résumé</h2>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill">${barWidth}% réussis</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-num blue">${totalTests}</div><div class="stat-label">Total</div></div>
      <div class="stat"><div class="stat-num green">${totalPassed}</div><div class="stat-label">Réussis</div></div>
      <div class="stat"><div class="stat-num red">${totalFailures}</div><div class="stat-label">Échoués</div></div>
    </div>
  </div>

  <div class="content">
    ${suitesHtml}
  </div>

  <footer>Nexus CRM — Rapport JUnit &nbsp;|&nbsp; PFE 2024</footer>
</body>
</html>`;

fs.writeFileSync(HTML_PATH, html, 'utf8');
console.log(`✅ Rapport généré : ${HTML_PATH}`);

// Ouvrir dans le navigateur (Windows)
try {
  const { exec } = require('child_process');
  exec(`start "" "${HTML_PATH}"`);
} catch (_) {}
