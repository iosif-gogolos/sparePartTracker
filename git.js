// git.js

const fs = new LightningFS('fs');
const pfs = fs.promises;

async function initRepo() {
    await pfs.mkdir('/repo');
    await pfs.writeFile('/repo/.gitignore', 'node_modules\n');
    await git.init({ fs, dir: '/repo' });
}

async function commitAndPushChanges(message = 'Daten Änderung') {
    const dir = '/repo';
    const author = {
        name: 'Your Name',
        email: 'your-email@example.com'
    };

    // Stage changes
    await git.add({ fs, dir, filepath: '.' });

    // Commit changes
    await git.commit({
        fs,
        dir,
        message,
        author
    });

    // Push changes
    await git.push({
        fs,
        dir,
        remote: 'origin',
        ref: 'main',
        token: 'YOUR_GITHUB_TOKEN'
    });
}

async function saveDataToFile(data, filename) {
    const dir = '/repo';
    await pfs.writeFile(`${dir}/${filename}`, JSON.stringify(data, null, 2));
    await commitAndPushChanges();
}