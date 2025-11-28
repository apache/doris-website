const fs = require('fs');
const path = require('path');

/**
 * Replace underscores with hyphens in filenames or directory names.
 * @param {string} inputPath - relative paths to be processed
 */
async function renameFilesAndDirs(inputPath) {
    const absolutePath = path.resolve(process.cwd(), inputPath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Path does not exist: ${absolutePath}`);
        return;
    }

    console.log(`🔍 Start processing the path: ${absolutePath}`);
    
    try {
        // Process subdirectories and files first, then process the current directory (depth-first).
        await processDirectory(absolutePath);
        console.log('✅ All files and directories have been renamed！');
    } catch (error) {
        console.error('❌ error:', error);
    }
}

/**
 * Recursive processing directory
 */
async function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            await processDirectory(fullPath);
            
            await renameItem(fullPath);
        } else if (stats.isFile() && isMarkdownFile(item)) {
            await renameItem(fullPath);
        }
    }
    
    if (dirPath !== path.resolve(process.cwd(), inputPath)) {
        await renameItem(dirPath);
    }
}

/**
 * Rename a file or directory
 */
async function renameItem(oldPath) {
    const dirName = path.dirname(oldPath);
    const oldName = path.basename(oldPath);
    
    if (!oldName.includes('_')) {
        return;
    }
    
    const newName = oldName.replace(/_/g, '-');
    
    if (oldName === newName) {
        return;
    }
    
    const newPath = path.join(dirName, newName);
    
    try {
        if (fs.existsSync(newPath)) {
            console.log(`⚠️  Skip, target already exists: ${newPath}`);
            return;
        }
        
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Rename: ${oldName} → ${newName}`);
        
    } catch (error) {
        console.error(`❌ Rename failed: ${oldPath} → ${newPath}`, error.message);
    }
}

/**
 * Check if it is a Markdown file
 */
function isMarkdownFile(filename) {
    return /\.(md|mdx)$/i.test(filename);
}

const inputPath = process.argv[2];

if (!inputPath) {
    console.error('❌ Please provide a valid path as an argument.');
    process.exit(1);
}

renameFilesAndDirs(inputPath);