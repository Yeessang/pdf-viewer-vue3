# pdf-viewer-vue3

一款Vue3框架开发的pdf阅读器组件


### demo
[demo地址](https://codesandbox.io/p/devbox/nice-keller-75ns2d?file=%2Fsrc%2FApp.vue%3A1%2C1-39%2C1)

## usage

```vue
<script setup>
import { ref } from 'vue';
import PDF from 'pdf-viewer-vue3';
import 'pdf-viewer-vue3/package/pdf-viewer.css';
const fileInput = ref();
const pdfComp = ref();
async function handleFileChange(event) {
  const files = event.target.files;
  const file = files[0];
  if (file) {
    const buffer = await file.arrayBuffer();
    pdfComp.value?.loadFile(buffer);
    console.log(pdfComp.value);
    // 会把pdfjs和pdfViewer等暴露出来
    // 可以自定义绑定pdfjs和pdfViewer内部事件、数据和方法
  }
}
function openFile() {
  fileInput.value?.click();
}
</script>

<template>
  <div>
    <button @click="openFile">选择文件</button>
    <input v-show="false" ref="fileInput" type="file" @change="handleFileChange">
    <PDF
      ref="pdfComp"
      @pagesLoaded="(v) => console.log('pagesLoaded 全部页面加载完', v)"
      @pageRendered="(v) => console.log('pageRendered 单页渲染', v)"
      @pageChanging="(v) => console.log('pageChanging 当前页改变', v)"
      @findChange="(v) => console.log('findChange 查找改变', v)"
      style="width: 800px; height: 500px; margin: auto;"
    ></PDF>
  </div>
</template>

<style scoped>

</style>

```

