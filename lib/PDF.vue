<template>
  <section
    class="pdf-wrapper"
    :style="{
      ...topicVariable
    }"
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
            :class="[smallMenu ? 'pdf-toolbar-container-small' : 'pdf-toolbar-container']"
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
              <li class="toolbar-page">
                <input
                  type="number" 
                  class="pdf-input" 
                  max="40" 
                  min="1" 
                  :value="currentScale" 
                  @keyup.enter="inputScaleHandler"
                />
                <span class="toolbar-page-percent">%</span>
              </li>
              <li class="toolbar-item" :class="[pageScale === 'page-height' && 'toolbar-item-active']" @click="changePageScale('page-height')">
                <i class="icon iconfont icon-zishiyinggaodu"></i>
                <span>适应高度</span>
              </li>
              <li class="toolbar-page" v-show="!smallMenu">
                <input
                  type="number" 
                  class="pdf-input"
                  :value="currentPage" 
                  @keyup.enter="pagePressHandler"
                />
                <span class="align-top mx-[5px] text-[13px]">/</span>
                <input
                  type="number" 
                  class="pdf-input disabled:text-[--pdf-toolbar-text-color]" 
                  :value="totalPage"
                  disabled
                />
              </li>
              <li class="toolbar-item" :class="[spreadMode === 0 && 'toolbar-item-active']" @click="changeSpreadMode(0)">
                <i class="icon iconfont icon-danyeshitu"></i>
                <span>单页视图</span>
              </li>
              <li class="toolbar-item" :class="[spreadMode === 1 && 'toolbar-item-active']" @click="changeSpreadMode(1)">
                <i class="icon iconfont icon-shuangyeshitu"></i>
                <span>双页视图</span>
              </li>
              <li class="toolbar-item" :class="[(rotation % 360 !== 0) && 'toolbar-item-active']" @click="changeRotation">
                <i class="icon iconfont icon-rotate" :style="{ transform: `rotate(${rotation}deg)` }"></i>
                <span>旋转</span>
              </li>
              <li class="toolbar-item toolbar-item-active" @click="changeScrollMode">
                <i class="icon iconfont icon-hengxianggundong1" :class="[scrollMode === 0 && 'pdf-rotate-90']"></i>
                <span>{{ scrollMode === 0 ? '竖向滚动' : '横向滚动' }}</span>
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
            class="pdf-input" 
            :value="currentPage" 
            @keyup.enter="pagePressHandler"
          />
          <span class="align-top mx-[5px] text-[13px]">/</span>
          <input
            type="number" 
            class="pdf-input disabled:text-[--pdf-toolbar-text-color]" 
            :value="totalPage"
            disabled
          />
        </div>
        <div class="pdf-menu-setting toolbar-item" v-if="smallMenu" ref="menuReference" :class="[showSmallMenu && 'toolbar-item-active']" @click="toggleMenu">
          <div class="menu-group-setting" :class="[showSmallMenu && 'menu-group-setting-active']"></div>
        </div>
      </div>
      <div class="absolute w-full bottom-[0] top-[50px] flex bg-[--pdf-show-bg]">
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
        class="absolute top-0 bottom-0 right-0 left-0 bg-[--pdf-mask-bg-color] z-[100]"
      >
        <div class="pdf-small-menu">
          <div class="relative w-[230px] h-[8px] rounded-[8px] overflow-hidden bg-[--pdf-mask-process-bg-color]">
            <div class="absolute w-full h-full bg-[--pdf-mask-process-highlight] transition-all" :style="{ transform: `translateX(${loadingPercent - 100}%)` }"></div>
          </div>
          <div class="mt-[10px] text-[12px] text-center text-[--pdf-mask-tip-color]">
            准备加载文档中，当前进度：{{ loadingPercent }}%
          </div>
        </div>
      </div>
      <div
        v-if="showPrint"
        class="absolute top-0 bottom-0 right-0 left-0 bg-[--pdf-mask-bg-color] z-[100]"
      >
        <div class="pdf-small-menu">
          <div class="relative w-[230px] h-[8px] rounded-[8px] overflow-hidden bg-[--pdf-mask-process-bg-color]">
            <div class="absolute w-full h-full bg-[--pdf-mask-process-highlight] transition-all" :style="{ transform: `translateX(${progress - 100}%)` }"></div>
          </div>
          <div class="mt-[10px] text-[12px] text-center text-[--pdf-mask-tip-color]">
            准备打印文档中，当前进度：{{ progress }}%
          </div>
          <div class="mt-[10px] text-center">
            <button class="text-[12px] text-[--pdf-mask-btn-color] py-[3px] px-[5px] rounded-[5px] transition-all hover:text-[--pdf-mask-btn-highlight] bg-transparent border-none outline-none bg-transparent" @click="abort">取消打印</button>
          </div>
        </div>
      </div>
      <Transition name="float-fade">
        <div
          v-show="showSearch"
          ref="floating" 
          class="w-[165px] min-h-[90px] px-[6px] py-[5px] absolute bg-[--pdf-toolbar-bg] rounded-[6px] z-[20] search-float transition-all duration-300 overflow-hidden"
          :style="{ transformOrigin: `${searchFloatXY.x}px ${searchFloatXY.y}px` }"
        >
          <div class="flex items-center">
            <input 
              type="text" 
              class="w-[100px] rounded-[3px] h-[27px] focus:border-[--pdf-toolbar-bg-highlight] outline-none px-[5px] py-[3px] text-[12px] mr-[5px] bg-[--pdf-toolbar-input-bg] text-[--pdf-toolbar-text-color]"
              v-model="searchKey"
              @input="input"
              @keyup.enter="findNext"
            />
            <i class="icon iconfont icon-jiantou_xiangshang pdf-search-toggle" @click="findPrev"></i>
            <i class="icon iconfont icon-jiantou_xiangxia pdf-search-toggle" @click="findNext"></i>
          </div>
          <div class="flex flex-wrap text-[12px] m-auto text-[--pdf-toolbar-text-color]">
            <div class="pdf-search-option" :class="[searchOptions.highlightAll && 'toolbar-item-active']" @click="toggleSearchOption('highlightAll')">全部高亮显示</div>
            <div class="pdf-search-option ml-[1px]" :class="[searchOptions.caseSensitive && 'toolbar-item-active']" @click="toggleSearchOption('caseSensitive')">区分大小写</div>
            <div class="pdf-search-option" :class="[searchOptions.matchDiacritics && 'toolbar-item-active']" @click="toggleSearchOption('matchDiacritics')">匹配变音符号</div>
            <div class="pdf-search-option ml-[1px]" :class="[searchOptions.entireWord && 'toolbar-item-active']" @click="toggleSearchOption('entireWord')">全词匹配</div>
          </div>
          <div class="text-[12px] text-[--pdf-toolbar-text-color] px-[5px] mt-[3px]" v-if="searchTotal > 0">
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
import { ref, nextTick, defineProps, defineExpose, defineEmits, watch, reactive, toRaw, shallowRef, onBeforeUnmount, computed } from 'vue';
import ResizeObserver from 'resize-observer-polyfill';
import { computePosition, flip, shift, size } from "@floating-ui/dom";
import { debounce } from '../core';
const baseTheme = {
  "light": {
    '--pdf-toolbar-bg': '#fff',
    '--pdf-toolbar-input-bg': 'rgb(241 245 249)',
    '--pdf-toolbar-text-color': 'rgb(55 65 81)',
    '--pdf-toolbar-text-highlight': 'rgb(99 102 241)',
    '--pdf-toolbar-bg-highlight': 'rgb(241 245 249)',
    '--pdf-show-bg': 'rgb(241 245 249)',
    '--pdf-thumbnail-bg': 'rgb(241, 245, 249)',
    '--pdf-thumbnail-border-color': '#6366f11a',
    '--pdf-thumbnail-text-color': 'rgb(55 65 81)',
    '--pdf-thumbnail-text-color-highlight': 'rgb(99 102 241)',
    '--pdf-catalogue-text-color': 'rgb(55 65 81)',
    '--pdf-catalogue-text-highlight': 'rgb(99 102 241)',
    '--pdf-menu-setting-color': 'rgb(55 65 81)',
    '--highlight-bg-color': 'rgba(230, 0, 120, 1)',
    '--highlight-selected-bg-color': 'rgba(100, 0, 0, 1)',
    '--pdf-mask-bg-color': 'rgba(241, 245, 249, .9)',
    '--pdf-mask-process-bg-color': '#D7D7E0',
    '--pdf-mask-process-highlight': 'rgb(167 139 250)',
    '--pdf-mask-tip-color': 'rgb(107 114 128)',
    '--pdf-mask-btn-color': 'rgb(167 139 250)',
    '--pdf-mask-btn-highlight': 'rgb(192 132 252)'
  },
  "dark": {
    '--pdf-toolbar-bg': '#222',
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
const props = defineProps({
  theme: {
    type: [String, Object],
    default: "light"
  }
})
const topicVariable = computed(() => {
  const type = typeof props.theme
  if (type == "string") {
    return baseTheme[props.theme] || baseTheme["dark"]
  }
  return props.theme
})
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
const emits = defineEmits(["pagesLoaded", "pageRendered", "pageChanging", "findChange", "scaleChanging"]);
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
      const isSmallMenu = dom.clientWidth < 700
      showSmallMenu.value = !isSmallMenu
      smallMenu.value = isSmallMenu
      if (isSmallMenu && menuFloating.value) menuFloating.value.style.display = 'none'
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
  rotation.value = 0;
  scrollMode.value = 0;
  currentScale.value = 100;
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
        },
        onScaleChanging: (v) => {
          currentScale.value = parseInt(v.scale * 100)
          emits("scaleChanging", v)
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
        middleware: [flip(), shift(), size({
          apply({availableHeight, elements}) {
            Object.assign(elements.floating.style, {
              maxHeight: `${Math.max(100, availableHeight - 15)}px`,
              overflowY: 'auto'
            });
          },
        })]
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

const rotation = ref(0)
const scrollMode = ref(0)
const currentScale = ref(100)
function inputScaleHandler(e) {
  let value = Number(e.target.value);
  changePageScale(value / 100)
}
function changeScrollMode() {
  scrollMode.value = scrollMode.value === 0 ? 1 : 0
  if (pdfInstance.value) {
    pdfInstance.value.viewer.scrollMode = scrollMode.value
  }
}
function changeRotation() {
  rotation.value += 90
  if (pdfInstance.value) {
    pdfInstance.value.viewer.pagesRotation = rotation.value % 360
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

.pdf-rotate-90 {
  transform: rotate(-90deg);
}

.search-float {
  box-shadow: 0 0 3px 3px rgba(0, 0, 0, 0.06);
}
.search-float input {
  border: 1px solid var(--pdf-show-bg);
}
.pdf-small-menu {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.pdf-menu-setting { 
  position: absolute; 
  right: 0; 
  width: 30px;
  height: 30px;
  line-height: 30px;
  margin-top: 10px;
}
 
.pdf-menu-setting .menu-group-setting { 
  width: 16px; 
  height: 17px; 
  position: relative;
  top: -1px;
}
.pdf-menu-setting .menu-group-setting:before, .pdf-menu-setting .menu-group-setting:after { 
  content: ""; 
  display: block; 
  width: 16px; 
  height: 2px; 
  background: var(--pdf-menu-setting-color); 
  border-radius: 2px; 
  position: absolute; 
  left: 0; 
  -webkit-transition: all 0.35s ease-in-out; 
  transition: all 0.35s ease-in-out;
}
.pdf-menu-setting .menu-group-setting:before { 
  top: 5px; 
  box-shadow: 0 10px var(--pdf-menu-setting-color);
}
.pdf-menu-setting .menu-group-setting:after { 
  bottom: 5px; 
}


.pdf-menu-setting .menu-group-setting-active:before { 
  top: 10px; 
  box-shadow: none; 
  -webkit-transform: rotate(225deg); 
  transform: rotate(225deg); 
}
.pdf-menu-setting .menu-group-setting-active:after { 
  bottom: 5px; 
  -webkit-transform: rotate(135deg); 
  transform: rotate(135deg); 
}
</style>
