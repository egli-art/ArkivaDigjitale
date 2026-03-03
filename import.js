const admin = require('firebase-admin');
const data  = require('./arkiva-digjitale-seed.json');

admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

const db = admin.firestore();

async function importCollection(ref, colData) {
    for (const [docId, docData] of Object.entries(colData)) {
        const { __collections__, ...fields } = docData;
        await ref.doc(docId).set(fields, { merge: true });
        if (__collections__) {
            for (const [subColName, subColData] of Object.entries(__collections__)) {
                await importCollection(ref.doc(docId).collection(subColName), subColData);
            }
        }
    }
}

async function main() {
    for (const [colName, colData] of Object.entries(data.__collections__)) {
        await importCollection(db.collection(colName), colData);
        console.log(`✓ ${colName}`);
    }
    console.log('Done!');
    process.exit(0);
}

main().catch(console.error);
