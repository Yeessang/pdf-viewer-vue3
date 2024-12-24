<template>
  <section
    class="pdf-wrapper"
  >
    <section
      ref="pdfWrapper"
      class="relative w-full h-full pt-[50px] rounded-[10px] overflow-hidden border border-slate-100"
      :key="renderKey"
    >
      <div class="pdf-toolbar">
        <Transition name="float-fade">
          <div
            v-show="showSmallMenu"
            ref="menuFloating"
            :class="[ smallMenu ? 'pdf-toolbar-container-small' : 'pdf-toolbar-container' ]"
            :style="{ transformOrigin: `${menuFloatXY.x}px ${menuFloatXY.y}px` }"
          >
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
              <li class="toolbar-page" v-show="!smallMenu">
                <input
                  type="number" 
                  class="pdf-input text-slate-600" 
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
        </Transition>
        <div 
          v-if="smallMenu"
          class="toolbar-page text-[11px] pdf-small-menu"
        >
          <input
            type="number" 
            class="pdf-input text-slate-600" 
            max="40" 
            min="1" 
            :value="currentPage" 
            @keyup.enter="pagePressHandler"
          />
          <span class="align-top mx-[5px]">/</span>
          <span class="toolbar-page-sum">{{ totalPage }}</span>
        </div>
        <div 
          v-if="smallMenu" 
          ref="menuReference" 
          class="toolbar-item w-[30px] absolute right-0 h-[30px] leading-[30px] py-0 mt-[10px]" 
          :class="[showSmallMenu && 'toolbar-item-active']"
          @click="toggleMenu"
        >
          <i class="icon iconfont icon-gengduo"></i>
        </div>
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
        v-if="loadingPercentVisible"
        class="absolute top-0 bottom-0 right-0 left-0 bg-[rgba(255,255,255,.9)] z-[100]"
      >
        <div class="absolute left-1/2 top-1/2 translate-y-[-50%] translate-x-[-50%]">
          <div class="relative w-[230px] h-[24px] rounded-[12px] overflow-hidden bg-slate-200">
            <div class="absolute w-full h-full bg-violet-300 transition-all" :style="{ transform: `translateX(${loadingPercent - 100}%)` }"></div>
          </div>
          <div class="mt-[10px] text-[12px] text-center text-gray-500">
            准备加载文档中，当前进度：{{ loadingPercent }}%
          </div>
        </div>
      </div>
      <div
        v-if="showPrint"
        class="absolute top-0 bottom-0 right-0 left-0 bg-[rgba(255,255,255,.9)] z-[100]"
      >
        <div class="pdf-small-menu">
          <div class="relative w-[230px] h-[24px] rounded-[12px] overflow-hidden bg-slate-200">
            <div class="absolute w-full h-full bg-violet-300 transition-all" :style="{ transform: `translateX(${progress - 100}%)` }"></div>
          </div>
          <div class="mt-[10px] text-[12px] text-center text-gray-500">
            准备打印文档中，当前进度：{{ progress }}%
          </div>
          <div class="mt-[10px] text-center">
            <button class="text-[12px] text-violet-400 py-[3px] px-[5px] rounded-[5px] transition-all hover:text-purple-400 bg-transparent border-none outline-none bg-transparent" @click="abort">取消打印</button>
          </div>
        </div>
      </div>
      <Transition name="float-fade">
        <div
          v-show="showSearch"
          ref="floating" 
          :style="{ transformOrigin: `${searchFloatXY.x}px ${searchFloatXY.y}px` }"
          class="w-[165px] min-h-[90px] px-[6px] py-[5px] absolute bg-white rounded-[6px] z-[20] search-float transition-all duration-300 overflow-hidden"
        >
          <div class="flex items-center">
            <input 
              type="text" 
              class="w-[100px] rounded-[3px] h-[27px] focus:border-violet-300 outline-none px-[5px] py-[3px] text-[12px] mr-[5px]"
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
  </section>
</template>

<script setup>
import PDFTree from './PDFTree.vue';
import { PDF } from '../core/pdf';
import { ref, nextTick, defineExpose, defineEmits, watch, reactive, toRaw, shallowRef, onBeforeUnmount } from 'vue';
import ResizeObserver from 'resize-observer-polyfill';
import { computePosition, flip, shift } from "@floating-ui/dom";
import { debounce } from '../core';
let pdfInstance = shallowRef();
const pdfWrapper = ref();
const pdfContainer = ref();
const thumbnailContainer = ref();
const renderKey = ref(0);
const showThumbnail = ref(false);
const currentPage = ref(1);
const totalPage = ref(0);
const loadingPercent = ref(0);
const loadingPercentVisible = ref(false);
const smallMenu = ref(false);
const showSmallMenu = ref(false);
const emits = defineEmits(["pagesLoaded", "pageRendered", "pageChanging", "findChange"]);
function pagePressHandler(e) {
  let value = Number(e.target.value);
  value = Math.min(Math.max(0, value), totalPage.value);
  currentPage.value = value;
  if (pdfInstance.value) {
    pdfInstance.value.viewer.currentPageNumber = value;
  }
}
const spreadMode = ref(0);
function changeSpreadMode(value) {
  if (pdfInstance.value) {
    spreadMode.value = value
    pdfInstance.value.viewer.spreadMode = value;
  }
}

const pageScale = ref("page-actual")
let sideEffectFn
function changePageScale(value) {
  if (pdfInstance.value) {
    pageScale.value = value
    pdfInstance.value.viewer.currentScaleValue = value;
    sideEffectFn?.()
    if (value === 'page-width' || value === 'page-height') {
      sideEffectFn = bindSize(pdfContainer.value, () => {
        pdfInstance.value.viewer.currentScaleValue = value;
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

watch(pdfWrapper, (dom) => {
  if (dom) {
    bindSize(dom, () => {
      const isSmallMenu = dom.clientWidth < 610
      showSmallMenu.value = !isSmallMenu
      setTimeout(() => {
        smallMenu.value = isSmallMenu
      }, 200)
    })
  }
}, {
  immediate: true
})

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
  loadingPercent.value = 0;
  resetSearch();
  nextTick(() => {
    pdfInstance.value = new PDF({
      pdfContainer: pdfContainer.value,
      thumbnailContainer: thumbnailContainer.value,
      listeners: {
        onPagesLoaded: (v) => {
          currentPage.value = 1;
          totalPage.value = v.pagesCount;
          emits("pagesLoaded", v);
        },
        onPageRendered: (v) => {
          emits("pageRendered", v);
        },
        onPageChanging: (v) => {
          currentPage.value = v.pageNumber;
          emits("pageChanging", v);
        },
        onFindChange: (v) => {
          searchIndex.value = v.matchesCount.current;
          searchTotal.value = v.matchesCount.total;
          emits("findChange", v)
        },
        onLoadProgress: (v) => {
          loadingPercentVisible.value = v < 100
          loadingPercent.value = v
        }
      }
    });
    pdfInstance.value.loadFile(config);
  })
}

watch(showThumbnail, (newValue) => {
  if (newValue) {
    pdfInstance.value?.initThumbnailViewer();
    setTimeout(() => {
      pdfInstance.value?.thumbViewer?.scrollThumbnailIntoView(currentPage.value);
    })
    showCatalog.value = false
  }
});


const catalogTreeData = ref([]);
const showCatalog = ref(false);
const clickCatalog = (node) => {
  const dest = node.dest
  pdfInstance.value?.link?.goToDestination(dest)
}
watch(showCatalog, async (newValue) => {
  if (newValue) {
    const outline = await pdfInstance.value?.pdf?.getOutline()
    catalogTreeData.value = outline
    showThumbnail.value = false
  }
});

const progress = ref(30);
const showPrint = ref(false);
let abortPrint;
async function print() {
  if (!pdfInstance.value) return
  showPrint.value = true;
  progress.value = 0;
  const { abort } = await pdfInstance.value?.printPDF(
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
  pdfInstance.value?.find(searchKey.value, toRaw(searchOptions))
}
const input = debounce(_search, 200)
function findPrev() {
  pdfInstance.value?.findPrev(searchKey.value, toRaw(searchOptions))
}
function findNext() {
  pdfInstance.value?.findNext(searchKey.value, toRaw(searchOptions))
}
function resetSearch() {
  searchKey.value = "";
  searchIndex.value = 0;
  searchTotal.value = 0;
}

const searchFloatXY = reactive({
  x: 0,
  y: 0
})
function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    resetSearch();
    nextTick(() => {
      computePosition(reference.value, floating.value, {
        placement: "bottom",
        middleware: [flip(), shift()]
      }).then(({ x, y, placement }) => {
        if (placement.includes("bottom")) {
          searchFloatXY.x = 120
          searchFloatXY.y = -10
        } else if (placement.includes("top")) {
          searchFloatXY.x = 120
          searchFloatXY.y = floating.value.offsetHeight + 10
        }
        Object.assign(floating.value.style, {
          top: `${y}px`,
          left: `${x - 3}px`
        });
      });
    })
  } else {
    resetSearch();
    input();
  }
}


const menuReference = ref();
const menuFloating = ref();
const menuFloatXY = reactive({
  x: 0,
  y: 0
})
function toggleMenu() {
  showSmallMenu.value = !showSmallMenu.value;
  if (showSmallMenu.value) {
    nextTick(() => {
      computePosition(menuReference.value, menuFloating.value, {
        placement: "bottom",
        middleware: [flip(), shift()]
      }).then(({ x, y, placement }) => {
        if (placement.includes("bottom")) {
          menuFloatXY.x = x / 2
          menuFloatXY.y = 10
        } else if (placement.includes("top")) {
          menuFloatXY.x = x / 2
          menuFloatXY.y = menuFloating.value.offsetHeight + 10
        }
        nextTick(() => {
          Object.assign(menuFloating.value.style, {
            top: `${y + 10}px`,
            left: `${x - 3}px`
          });
        })
      });
    })
  }
}

function destroy() {
  if (pdfInstance.value) pdfInstance.value.pdf?.destroy?.()
}

onBeforeUnmount(() => {
  destroy()
})

defineExpose({
  loadFile,
  pdfInstance,
  destroy
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
  transform: scale(0);
}

.float-fade-enter-from,
.float-fade-leave-to {
  opacity: 0;
  transform: scale(0);
}

.float-fade-enter-to,
.float-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}


.search-float {
  box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.06);
}
.search-float input {
  border: 1px solid #e5e7eb;
}
.pdf-small-menu {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
