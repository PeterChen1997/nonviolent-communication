#!/usr/bin/env node

/**
 * PWA图标生成脚本
 * 
 * 使用方法：
 * 1. 安装依赖：npm install sharp
 * 2. 运行脚本：node generate-icons.js
 * 
 * 该脚本会使用 public/logo-light.png 作为源图片，
 * 生成PWA所需的各种尺寸图标
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查是否安装了sharp
let sharp;
try {
  const sharpModule = await import('sharp');
  sharp = sharpModule.default;
} catch (error) {
  console.error('❌ 请先安装 sharp: npm install sharp');
  process.exit(1);
}

const sourceImage = path.join(__dirname, 'public', 'logo-light.png');
const publicDir = path.join(__dirname, 'public');

// 检查源图片是否存在
if (!fs.existsSync(sourceImage)) {
  console.error('❌ 找不到源图片:', sourceImage);
  console.error('请确保 public/logo-light.png 存在');
  process.exit(1);
}

// 需要生成的图标尺寸
const iconSizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // iOS
];

async function generateIcons() {
  console.log('🎨 开始生成PWA图标...');
  
  try {
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // 白色背景
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ 生成了 ${name} (${size}x${size})`);
    }
    
    console.log('🎉 所有PWA图标生成完成！');
    console.log('\n📱 现在你的应用支持PWA了！');
    console.log('在Safari中访问应用，然后点击分享按钮 → "添加到主屏幕"');
    
  } catch (error) {
    console.error('❌ 生成图标时出错:', error);
  }
}

// 运行生成图标函数
generateIcons();
