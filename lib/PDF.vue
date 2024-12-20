<template>
  <section
    class="relative pt-[50px] rounded-[10px] overflow-hidden border border-slate-100"
    :key="renderKey"
  >
    <div class="pdf-toolbar flex pdf-menu w-full h-[50px] absolute top-0 bg-[#fff] shadow-lg z-10">
      <ul class="toolbar-group">
        <li class="toolbar-item" :class="[showThumbnail && 'toolbar-item-active']" @click="showThumbnail = !showThumbnail">
          <i class="icon iconfont icon-xiaosuolvetu"></i>
          <span>缩略图</span>
        </li>
        <li class="toolbar-item" :class="[showCatalog && 'toolbar-item-active']" @click="showCatalog = !showCatalog">
          <i class="icon iconfont icon-mulu"></i>
          <span>目录</span>
        </li>
      </ul>
      <ul class="toolbar-group">
        <li class="toolbar-item" :class="[pageScale === 'page-actual' && 'toolbar-item-active']" @click="changePageScale('page-actual')">
          <i class="icon iconfont icon-yuanchicun"></i>
          <span>原尺寸</span>
        </li>
        <li class="toolbar-item" :class="[pageScale === 'page-width' && 'toolbar-item-active']" @click="changePageScale('page-width')">
          <i class="icon iconfont icon-zishiyingkuandu"></i>
          <span>适应宽度</span>
        </li>
        <li class="toolbar-item" :class="[pageScale === 'page-height' && 'toolbar-item-active']" @click="changePageScale('page-height')">
          <i class="icon iconfont icon-zishiyinggaodu"></i>
          <span>适应高度</span>
        </li>
        <li class="toolbar-page">
          <input 
            type="number" 
            class="pdf-input" 
            max="40" 
            min="1" 
            :value="currentPage" 
            @keyup.enter="pagePressHandler"
          />
          <span class="align-top mx-[5px]">/</span>
          <span class="toolbar-page-sum">{{ totalPage }}</span>
        </li>
        <li class="toolbar-item" :class="[spreadMode === 0 && 'toolbar-item-active']" @click="changeSpreadMode(0)">
          <i class="icon iconfont icon-danyeshitu"></i>
          <span>单页视图</span>
        </li>
        <li class="toolbar-item" :class="[spreadMode === 1 && 'toolbar-item-active']" @click="changeSpreadMode(1)">
          <i class="icon iconfont icon-shuangyeshitu"></i>
          <span>双页视图</span>
        </li>
      </ul>
      <ul class="toolbar-group">
        <li class="toolbar-item" ref="reference" :class="[showSearch && 'toolbar-item-active']" @click="toggleSearch">
          <i class="icon iconfont icon-chaxun"></i>
          <span>查询</span>
        </li>
        <li class="toolbar-item" @click="print">
          <i class="icon iconfont icon-dayinji_o"></i>
          <span>打印</span>
        </li>
      </ul>
    </div>
    <div class="absolute w-full bottom-[0] top-[50px] flex bg-slate-100">
      <Transition name="transform">
        <div class="pdf-thumbnail" v-show="showThumbnail || showCatalog">
          <PDFTree
            v-show="showCatalog"
            :tree-data="catalogTreeData"
            node-key="title"
            @node-click="clickCatalog"
          ></PDFTree>
          <div
            v-show="showThumbnail" 
            class="pdf-thumbnail-container" 
            ref="thumbnailContainer" 
          ></div>
        </div>
      </Transition>
      <div class="flex-1 relative">
        <div
          ref="pdfContainer" 
          class="pdf-container absolute w-full h-full overflow-auto"
        >
          <div class="pdfViewer"></div>
        </div>
      </div>
    </div>
    <div
      v-if="showPrint"
      class="absolute top-0 bottom-0 w-full bg-[rgba(255,255,255,.8)] z-[100]"
    >
      <div class="absolute left-1/2 top-1/2 translate-y-[-50%] translate-x-[-50%]">
        <div class="relative w-[230px] h-[24px] rounded-[12px] overflow-hidden bg-slate-200">
          <div class="absolute w-full h-full bg-violet-300 transition-all" :style="{ transform: `translateX(${progress - 100}%)` }"></div>
        </div>
        <div class="mt-[10px] text-[12px] text-center text-gray-500">
          准备打印文档中，当前进度：{{ progress }}%
        </div>
        <div class="mt-[10px] text-center">
          <button class="text-[12px] text-violet-400 py-[3px] px-[5px] rounded-[5px] transition-all hover:text-purple-400" @click="abort">取消打印</button>
        </div>
      </div>
    </div>
    <Transition name="float-fade">
      <div
        v-show="showSearch"
        ref="floating" 
        class="w-[165px] min-h-[90px] px-[6px] py-[5px] absolute bg-white rounded-[6px] z-[20] search-float transition-all duration-300 overflow-hidden"
      >
        <div class="flex items-center">
          <input 
            type="text" 
            class="w-[100px] border rounded-[3px] focus:border-violet-300 outline-none px-[5px] py-[3px] text-[12px] mr-[5px]"
            v-model="searchKey"
            @input="input"
            @keyup.enter="findNext"
          />
          <i class="icon iconfont icon-jiantou_xiangshang pdf-search-toggle" @click="findPrev"></i>
          <i class="icon iconfont icon-jiantou_xiangxia pdf-search-toggle" @click="findNext"></i>
        </div>
        <div class="flex flex-wrap text-[12px] m-auto text-slate-500">
          <div class="pdf-search-option" :class="[searchOptions.highlightAll && 'toolbar-item-active']" @click="toggleSearchOption('highlightAll')">全部高亮显示</div>
          <div class="pdf-search-option ml-[1px]" :class="[searchOptions.caseSensitive && 'toolbar-item-active']" @click="toggleSearchOption('caseSensitive')">区分大小写</div>
          <div class="pdf-search-option" :class="[searchOptions.matchDiacritics && 'toolbar-item-active']" @click="toggleSearchOption('matchDiacritics')">匹配变音符号</div>
          <div class="pdf-search-option ml-[1px]" :class="[searchOptions.entireWord && 'toolbar-item-active']" @click="toggleSearchOption('entireWord')">全词匹配</div>
        </div>
        <div class="text-[12px] text-slate-500 px-[5px] mt-[3px]" v-if="searchTotal > 0">
          第{{ searchIndex }}项，共{{ searchTotal }}项
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import PDFTree from './PDFTree.vue';
import { PDF } from '../core/pdf';
import { ref, nextTick, defineExpose, watch, reactive, toRaw } from 'vue';
import ResizeObserver from 'resize-observer-polyfill';
import { computePosition, flip, shift } from "@floating-ui/dom";
import { debounce } from '../core';
let pdfInstance;
const pdfContainer = ref();
const thumbnailContainer = ref();
const renderKey = ref(0);
const showThumbnail = ref(false);

const currentPage = ref(1);
const totalPage = ref(0);
function pagePressHandler(e) {
  let value = Number(e.target.value);
  value = Math.min(Math.max(0, value), totalPage.value);
  currentPage.value = value;
  if (pdfInstance) {
    pdfInstance.viewer.currentPageNumber = value;
  }
}
const spreadMode = ref(0);
function changeSpreadMode(value) {
  if (pdfInstance) {
    spreadMode.value = value
    pdfInstance.viewer.spreadMode = value;
  }
}

const pageScale = ref("page-actual")
let sideEffectFn
function changePageScale(value) {
  if (pdfInstance) {
    pageScale.value = value
    pdfInstance.viewer.currentScaleValue = value;
    sideEffectFn?.()
    if (value === 'page-width' || value === 'page-height') {
      sideEffectFn = bindSize(pdfContainer.value, () => {
        pdfInstance.viewer.currentScaleValue = value;
      })
    }
  }
}
function bindSize(dom, callback) {
  const ro = new ResizeObserver(() => {
    callback?.()
  });
  
  ro.observe(dom);
  return () => {
    ro.unobserve(dom)
  }
}

function loadFile(data) {
  const config = {}
  if (typeof data == 'string') {
    config.url = data
  } else {
    config.data = data
  }
  renderKey.value++;
  showThumbnail.value = false;
  showCatalog.value = false;
  catalogTreeData.value = [];
  showSearch.value = false;
  resetSearch();
  nextTick(() => {
    pdfInstance = new PDF({
      pdfContainer: pdfContainer.value,
      thumbnailContainer: thumbnailContainer.value,
      listeners: {
        onPagesLoaded: (v) => {
          currentPage.value = 1;
          totalPage.value = v.pagesCount;
        },
        onPageRendered: (v) => {console.log("pagerendered", v)},
        onPageChanging: (v) => {
          currentPage.value = v.pageNumber;
        },
        onFindChange: (v) => {
          searchIndex.value = v.matchesCount.current;
          searchTotal.value = v.matchesCount.total;
        }
      }
    });
    pdfInstance.loadFile(config);
  })
}

watch(showThumbnail, (newValue) => {
  if (newValue) {
    pdfInstance?.initThumbnailViewer();
    setTimeout(() => {
      pdfInstance?.thumbViewer?.scrollThumbnailIntoView(currentPage.value);
    })
    showCatalog.value = false
  }
});


const catalogTreeData = ref([]);
const showCatalog = ref(false);
const clickCatalog = (node) => {
  const dest = node.dest
  pdfInstance?.link?.goToDestination(dest)
}
watch(showCatalog, async (newValue) => {
  if (newValue) {
    const outline = await pdfInstance?.pdf?.getOutline()
    catalogTreeData.value = outline
    showThumbnail.value = false
  }
});

const progress = ref(30);
const showPrint = ref(false);
let abortPrint;
async function print() {
  if (!pdfInstance) return
  showPrint.value = true;
  progress.value = 0;
  const { abort } = await pdfInstance?.printPDF(
    (v) => progress.value = v,
    () => showPrint.value = false
  );
  abortPrint = abort;
}
function abort() {
  abortPrint?.();
}

const searchKey = ref("");
const showSearch = ref(false);
const reference = ref();
const floating = ref();
const searchIndex = ref(0);
const searchTotal = ref(0);
const searchOptions = reactive({
  highlightAll: false, // 所有找到的都渲染
  matchDiacritics: false, // 匹配变音符号
  caseSensitive: false, // 区分大小写
  entireWord: false // 全词匹配
})
function toggleSearchOption(key) {
  searchOptions[key] = !searchOptions[key]
  if (!searchKey.value) return
  if (key !== 'highlightAll') {
    searchTotal.value = 0
    searchIndex.value = 0
  }
  input()
}
function _search() {
  pdfInstance?.find(searchKey.value, toRaw(searchOptions))
}
const input = debounce(_search, 200)
function findPrev() {
  pdfInstance?.findPrev(searchKey.value, toRaw(searchOptions))
}
function findNext() {
  pdfInstance?.findNext(searchKey.value, toRaw(searchOptions))
}
function resetSearch() {
  searchKey.value = "";
  searchIndex.value = 0;
  searchTotal.value = 0;
}
function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    resetSearch();
    nextTick(() => {
      computePosition(reference.value, floating.value, {
        placement: "bottom",
        middleware: [flip(), shift()]
      }).then(({ x, y }) => {
        Object.assign(floating.value.style, {
          top: `${y}px`,
          left: `${x}px`
        });
      });
    })
  } else {
    resetSearch();
    input();
  }
}

defineExpose({
  loadFile
});

</script>

<style>
.transform-enter-active,
.transform-leave-active {
  transform: translateX(-200px);
}

.transform-enter-from,
.transform-leave-to {
  
}

.float-fade-enter-active,
.float-fade-leave-active {
  opacity: 0;
}

.float-fade-enter-from,
.float-fade-leave-to {
  opacity: 0;
}


.search-float {
  box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.06);
}
</style>
