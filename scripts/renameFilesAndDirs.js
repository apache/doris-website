const fs = require('fs');
const path = require('path');

/**
 * 将文件名或目录名中的下划线替换为连字符
 * @param {string} inputPath - 要处理的相对路径
 */
async function renameFilesAndDirs(inputPath) {
    const absolutePath = path.resolve(process.cwd(), inputPath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ 路径不存在: ${absolutePath}`);
        return;
    }

    console.log(`🔍 开始处理路径: ${absolutePath}`);
    
    try {
        // 先处理子目录和文件，再处理当前目录（深度优先）
        await processDirectory(absolutePath);
        console.log('✅ 所有文件和目录重命名完成！');
    } catch (error) {
        console.error('❌ 处理过程中发生错误:', error);
    }
}

/**
 * 递归处理目录
 */
async function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    // 先处理子项（深度优先）
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            // 递归处理子目录
            await processDirectory(fullPath);
            
            // 处理完子内容后，重命名当前目录
            await renameItem(fullPath);
        } else if (stats.isFile() && isMarkdownFile(item)) {
            // 处理文件
            await renameItem(fullPath);
        }
    }
    
    // 处理当前目录本身（如果是目标路径的子目录）
    if (dirPath !== path.resolve(process.cwd(), inputPath)) {
        await renameItem(dirPath);
    }
}

/**
 * 重命名文件或目录
 */
async function renameItem(oldPath) {
    const dirName = path.dirname(oldPath);
    const oldName = path.basename(oldPath);
    
    // 只处理包含下划线的名称
    if (!oldName.includes('_')) {
        return;
    }
    
    const newName = oldName.replace(/_/g, '-');
    
    // 如果名称没有变化，跳过
    if (oldName === newName) {
        return;
    }
    
    const newPath = path.join(dirName, newName);
    
    try {
        // 检查新路径是否已存在
        if (fs.existsSync(newPath)) {
            console.log(`⚠️  跳过，目标已存在: ${newPath}`);
            return;
        }
        
        fs.renameSync(oldPath, newPath);
        console.log(`✅ 重命名: ${oldName} → ${newName}`);
        
    } catch (error) {
        console.error(`❌ 重命名失败: ${oldPath} → ${newPath}`, error.message);
    }
}

/**
 * 检查是否为 Markdown 文件
 */
function isMarkdownFile(filename) {
    return /\.(md|mdx)$/i.test(filename);
}

// 使用示例
const inputPath = process.argv[2];

if (!inputPath) {
    console.log(`
📝 使用方法: node rename-script.js <相对路径>

示例:
  node rename-script.js docs
  node rename-script.js ./content
  node rename-script.js ../my-project

功能:
  - 将指定路径下所有 .md 和 .mdx 文件中的下划线改为连字符
  - 同时也会重命名目录
  - 使用深度优先遍历，确保子项先被处理
    `);
    process.exit(1);
}

// 执行重命名
renameFilesAndDirs(inputPath);