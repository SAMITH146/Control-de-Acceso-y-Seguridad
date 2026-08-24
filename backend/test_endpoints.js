const app = require('./app');
const http = require('http');

const server = app.listen(3001, '127.0.0.1', async () => {
    console.log('Server started on 3001');

    function makeReq(path) {
        return new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:3001${path}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });
    }

    try {
        console.log('--- TEST 1: /api/bitacora (todas) ---');
        const resBitacora = await makeReq('/api/bitacora');
        console.log(`Visitas encontradas: ${resBitacora.length}`);
        console.log(resBitacora);

        console.log('\n--- TEST 2: /api/visitantes/buscar?documento=1097609002 ---');
        const resVis = await makeReq('/api/visitantes/buscar?documento=1097609002');
        console.log(resVis);

    } catch (e) {
        console.error('Test error:', e);
    } finally {
        server.close();
    }
});
