# pdf-viewer-vue3

一款Vue3框架开发的pdf阅读器组件，如果您使用的是Vue2，可以查看[Vue2PDF阅读器组件地址](https://www.npmjs.com/package/pdf-viewer-vue2)

## demo

[demo地址](https://codesandbox.io/p/devbox/nice-keller-75ns2d?file=%2Fsrc%2FApp.vue%3A1%2C1-39%2C1)

## Feature

- 文本选中、复制
- 缩略图
- 目录
- 翻页、跳转页
- 单页/双页视图
- 缩放/容器宽/容器高/原尺寸/自定义尺寸
- 打印
- 搜索文本
- 旋转
- 横向/竖向滚动
- 移动端
- 深色、浅色主题
- 自定义主题(变量文档待更新)

## usage

```vue
<script setup>
import { ref } from 'vue';
import PDF from 'pdf-viewer-vue3';
import 'pdf-viewer-vue3/package/pdf-viewer.css';
const fileInput = ref();
const pdfComp = ref();
const pdfMobileComp = ref();
const theme = ref("light");
async function handleFileChange(event) {
  const files = event.target.files;
  const file = files[0];
  if (file) {
    // loadFile支持buffer数据，也支持解决了跨域问题的文件地址链接（cors支持的文件地址或者在您的项目中nginx代理转发的下载地址都可以）
    const buffer = await file.arrayBuffer();
    pdfMobileComp.value?.loadFile(buffer);
    const reReadBuffer = await file.arrayBuffer();
    pdfComp.value?.loadFile(reReadBuffer);
    
    console.log(pdfComp.value);
  }
}
function openFile() {
  fileInput.value?.click();
}
function customTheme() {
  theme.value = {
    '--pdf-toolbar-bg': '#ccc',
    '--pdf-toolbar-input-bg': '#141414',
    '--pdf-toolbar-text-color': '#EBEBEB',
    '--pdf-toolbar-text-highlight': 'rgb(99 102 241)',
    '--pdf-toolbar-bg-highlight': '#39383D',
    '--pdf-show-bg': '#39383D',
    '--pdf-thumbnail-bg': '#222',
    '--pdf-thumbnail-border-color': '#39383D',
    '--pdf-thumbnail-text-color': '#EBEBEB',
    '--pdf-thumbnail-text-color-highlight': 'rgb(99 102 241)',
    '--pdf-catalogue-text-color': '#EBEBEB',
    '--pdf-catalogue-text-highlight': 'rgb(99 102 241)',
    '--pdf-menu-setting-color': '#EBEBEB',
    '--highlight-bg-color': 'rgba(230, 0, 120, 1)',
    '--highlight-selected-bg-color': 'rgba(100, 0, 0, 1)',
    '--pdf-mask-bg-color': 'rgba(34, 34, 34, .9)',
    '--pdf-mask-process-bg-color': '#D7D7E0',
    '--pdf-mask-process-highlight': 'rgb(167 139 250)',
    '--pdf-mask-tip-color': 'rgb(107 114 128)',
    '--pdf-mask-btn-color': 'rgb(167 139 250)',
    '--pdf-mask-btn-highlight': 'rgb(192 132 252)'
  }
}
</script>

<template>
  <div>
    <button @click="openFile">选择文件</button>
    <button @click="theme = 'dark'">黑色主题</button>
    <button @click="theme = 'light'">浅色主题</button>
    <button @click="customTheme">自定义主题</button>
    <input v-show="false" ref="fileInput" type="file" @change="handleFileChange">
    <p>左侧为大尺寸工具栏，右侧为小尺寸工具栏</p>
    <div 
      style="display: flex;"
    >
      <PDF
        ref="pdfComp"
        :theme="theme"
        @pagesLoaded="(v) => console.log('pagesLoaded', v)"
        @pageRendered="(v) => console.log('pageRendered', v)"
        @pageChanging="(v) => console.log('pageChanging', v)"
        @findChange="(v) => console.log('findChange', v)"
        @scaleChanging="(v) => console.log('scaleChanging 缩放比例改变', v)"
        style="width: 800px; height: 500px; margin: auto;"
      ></PDF>
      <PDF
        ref="pdfMobileComp"
        :theme="theme"
        @pagesLoaded="(v) => console.log('pagesLoaded', v)"
        @pageRendered="(v) => console.log('pageRendered', v)"
        @pageChanging="(v) => console.log('pageChanging', v)"
        @findChange="(v) => console.log('findChange', v)"
        @scaleChanging="(v) => console.log('scaleChanging 缩放比例改变', v)"
        style="width: 300px; height: 500px; margin-left: 20px;"
      ></PDF>
    </div>
    
  </div>
</template>

<style scoped>

</style>
```

