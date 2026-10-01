const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Not available? We can just use a recursive function.

const srcDir = path.join(__dirname, 'src');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(srcDir);
const glassCardPath = path.join(srcDir, 'components', 'ui', 'GlassCard.tsx');

files.forEach(file => {
    if (file === glassCardPath) return;
    
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('import { GlassBlur }') || content.includes('import { GlassCard }') || content.includes('import { GlassEdge }')) {
        const fileDir = path.dirname(file);
        let relativePath = path.relative(fileDir, path.join(srcDir, 'components', 'ui', 'GlassCard'));
        
        // ensure starts with ./ or ../
        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }

        content = content.replace(/import \{(.+?)\} from '.*?components\/ui\/GlassCard';/g, `import {$1} from '${relativePath}';`);
        
        fs.writeFileSync(file, content, 'utf8');
    }
});
console.log('Fixed relative imports');
