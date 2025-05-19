const fetch = require('node-fetch');

const jsonUrl = 'https://raw.githubusercontent.com/snaldasc/benchmark/main/locations.json';
const cronitorPingUrl = 'https://cronitor.link/p/100dad5c384844918c1cba79db7bd291/w2zpMt'; // <-- Ersetze mit deinem Cronitor Link

async function checkJsonAndPing() {
  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error(`JSON not reachable: ${res.statusText}`);

    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('JSON ist kein Array');

    console.log('✅ JSON ist valide. Pinge Cronitor...');
    await fetch(cronitorPingUrl);
    console.log('📡 Cronitor gepingt.');
  } catch (err) {
    console.error('❌ Fehler beim JSON-Check:', err.message);
    // Kein Ping → Cronitor schlägt Alarm
    process.exit(1);
  }
}

checkJsonAndPing();
