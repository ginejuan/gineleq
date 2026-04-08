
function isOnco(diagnostico: string): boolean {
    const d = diagnostico.toUpperCase();
    return d.startsWith('NEOPLASIA MALIGNA') || d.startsWith('CARCINOMA IN SITU');
}

const testCases = [
    { diag: 'NEOPLASIA MALIGNA DE MAMA', expected: true },
    { diag: 'NEOPLASIA MALIGNA DE OVARIO', expected: true },
    { diag: 'CARCINOMA IN SITU DE CUELLO UTERINO', expected: true },
    { diag: 'CARCINOMA IN SITU DE MAMA', expected: true },
    { diag: 'MIOMA UTERINO', expected: false },
    { diag: 'quiste de ovario', expected: false },
];

console.log('--- Verifying Oncology Definition ---');
testCases.forEach(({ diag, expected }) => {
    const result = isOnco(diag);
    console.log(`Diagnosis: "${diag}" | Expected: ${expected} | Result: ${result} | ${result === expected ? '✅' : '❌'}`);
});
