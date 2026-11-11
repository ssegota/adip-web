/*
 * Radni proces za kopije za prikaz (pokreće ga lib/display-queue.js preko fork()).
 * Odvojen je od servera da libvips/sharp memorija nestane kad posao završi i da
 * eventualni pad (npr. premalo memorije) ne sruši web server.
 * Protokol (IPC): roditelj šalje { file }, worker odgovara { file, result } ili
 * { file, error }; na početku šalje { engine }. Izlazi kad roditelj prekine vezu.
 */
const { makeDisplayCopy, detectEngine } = require('./display-copies');

(async () => {
    const engine = await detectEngine();
    process.send({ engine });
    if (engine === 'none') return process.disconnect();
    let chain = Promise.resolve();
    process.on('message', msg => {
        if (!msg || !msg.file) return;
        chain = chain.then(async () => {
            const t0 = Date.now();
            try {
                const result = await makeDisplayCopy(msg.file);
                process.send({ file: msg.file, result, ms: Date.now() - t0 });
            } catch (e) {
                process.send({ file: msg.file, error: e.message || String(e) });
            }
        });
    });
    process.on('disconnect', () => process.exit(0));
})().catch(e => {
    try { process.send({ engine: 'none', error: e.message }); } catch (e2) { /* ignore */ }
    process.exit(1);
});
