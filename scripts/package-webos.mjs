import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stage = join(root, 'release-assets', 'webos-app');
const outDir = join(root, 'release-assets');

rmSync(stage, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
    'npx',
    ['expo', 'export', '--platform', 'web', '--output-dir', stage],
    { cwd: root, stdio: 'inherit' }
);

writeFileSync(
    join(stage, 'appinfo.json'),
    JSON.stringify(
        {
            id: 'com.alexalghisi.nextube',
            version: '1.0.0',
            vendor: 'alexalghisi',
            type: 'web',
            main: 'index.html',
            title: 'Nex Tube',
            icon: 'icon.png',
            largeIcon: 'largeIcon.png',
            bgColor: '#0f0f0f',
            iconColor: '#0f0f0f',
            disableBackHistoryAPI: true,
            requiredACG: [],
        },
        null,
        4
    )
);

execFileSync('sips', ['-z', '80', '80', join(root, 'assets/icon.png'), '--out', join(stage, 'icon.png')], {
    stdio: 'inherit',
});
execFileSync(
    'sips',
    ['-z', '130', '130', join(root, 'assets/icon.png'), '--out', join(stage, 'largeIcon.png')],
    { stdio: 'inherit' }
);

execFileSync('npx', ['--yes', '-p', '@webos-tools/cli', 'ares-package', stage, '-o', outDir], {
    cwd: root,
    stdio: 'inherit',
});
