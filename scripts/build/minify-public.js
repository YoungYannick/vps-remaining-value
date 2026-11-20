const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');

const root = path.resolve(__dirname, '..', '..');
const sourceDir = path.join(root, 'public');
const outputDir = path.join(root, 'build', 'public');

async function collectFiles(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const target = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await collectFiles(target));
        } else {
            files.push(target);
        }
    }
    return files;
}

async function minifyFile(file) {
    const content = await fs.promises.readFile(file);
    const ext = path.extname(file).toLowerCase();
    if (ext === '.css') {
        const result = new CleanCSS({ level: 2 }).minify(content.toString('utf8'));
        if (result.errors.length) throw new Error(result.errors.join('; '));
        return Buffer.from(result.styles, 'utf8');
    }
    if (ext === '.js') {
        const result = await minifyJs(content.toString('utf8'), { compress: true, mangle: true });
        if (!result.code) throw new Error('压缩结果为空');
        return Buffer.from(result.code, 'utf8');
    }
    if (ext === '.html') {
        const result = await minifyHtml(content.toString('utf8'), {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            ignoreCustomFragments: [/\{\{[\s\S]*?\}\}/g]
        });
        return Buffer.from(result, 'utf8');
    }
    return content;
}

async function main() {
    await fs.promises.rm(outputDir, { recursive: true, force: true });
    const files = await collectFiles(sourceDir);
    let sourceBytes = 0;
    let outputBytes = 0;
    for (const file of files) {
        const relative = path.relative(sourceDir, file);
        const target = path.join(outputDir, relative);
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        const source = await fs.promises.readFile(file);
        sourceBytes += source.length;
        const output = await minifyFile(file);
        await fs.promises.writeFile(target, output);
        outputBytes += output.length;
    }
    console.log(`[minify] public -> build/public (${(sourceBytes / 1024).toFixed(1)} KB -> ${(outputBytes / 1024).toFixed(1)} KB)`);
}

main().catch((error) => {
    console.error(`[minify] 失败: ${error.message}`);
    process.exit(1);
});