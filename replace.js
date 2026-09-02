import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('import configPromise from ')) {
        content = content.replace(/import configPromise from ['\"].*?payload\.config['\"]/g, 'import configPromise from \'@payload-config\'');
        fs.writeFileSync(f, content);
    }
});
console.log('Replaced imports');
