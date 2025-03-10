
import * as PDFJS from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry.js'
import { PDFViewer, PDFFindController, PDFLinkService, EventBus, DownloadManager } from "./pdf_viewer";
import { PDFThumbnailViewer } from './pdf_thumbnail_viewer'
import { createPrintService, abort } from './print_service.js'
import './requestIdleCallback'


PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker


export class PDF {
  constructor({
    listeners = {},
    pdfContainer = null,
    thumbnailContainer = null,
    renderOptions = {}
  }) {
    if (!pdfContainer) {
      throw new Error("pdfContainer is required")
    }
    this.pdf = null
    this.eventBus = null
    this.link = null
    this.findController = null
    this.viewer = null
    this.downloadManager = null
    this.thumbViewer = null
    this.listeners = listeners
    this.pdfContainer = pdfContainer
    this.thumbnailContainer = thumbnailContainer
    this.totalPages = 0
    this.renderOptions = renderOptions
    this.init()
  }

  init() {
    this
    .initEventBus()
    .initLink()
    .initFindController()
    .initDownloadManager()
  }

  initEventBus() {
    this.eventBus = new EventBus({})
    return this
  }
  
  initLink() {
    this.link = new PDFLinkService({
      eventBus: this.eventBus
    })
    return this
  }

  initFindController() {
    this.findController = new PDFFindController({
      linkService: this.link,
      eventBus: this.eventBus
    })
    const changeSearchInfo = (v) => {
      this.listeners?.onFindChange?.(v)
    }
    this.eventBus.on("updatefindmatchescount", changeSearchInfo)
    this.eventBus.on("updatefindcontrolstate", changeSearchInfo)
    return this
  }

  initDownloadManager() {
    this.downloadManager = new DownloadManager(false)
    return this
  }

  initThumbnailViewer() {
    if (!this.thumbnailContainer || this.thumbViewer) return
    this.thumbViewer = new PDFThumbnailViewer({
      container: this.thumbnailContainer,
      renderingQueue: this.viewer.renderingQueue,
      linkService: this.link,
      eventBus: this.eventBus
    })
    this.thumbViewer.setDocument(this.pdf)
    this.viewer.renderingQueue.setThumbnailViewer(this.thumbViewer)
    this.eventBus.on("pagechanging", (pageInfo) => {
      this.thumbViewer?.scrollThumbnailIntoView(pageInfo.pageNumber)
    })
    setTimeout(() => {
      this.thumbViewer.forceRendering()
    })
  }

  loadFile(options) {
    let percentLoaded = 0
    let total = 0
    let loaded = 0
    // options.disableFontFace = true
    return new Promise((resolve) => {
      this.eventBus.on("pagesloaded", (v) => {
        this.listeners?.onPagesLoaded?.(v)
        resolve()
      })
      this.eventBus.on("pagerendered", (v) => {
        this.listeners?.onPageRendered?.(v)
      })
      this.eventBus.on("pagechanging", (pageInfo) => {
        this.listeners?.onPageChanging?.(pageInfo)
      })
      this.eventBus.on("scalechanging", (scaleInfo) => {
        this.listeners?.onScaleChanging?.(scaleInfo)
      })
      const loadingTask = PDFJS.getDocument(options)
      loadingTask.onProgress = (progressData) => {
        percentLoaded = Math.min(100, Math.round(
          (progressData.loaded / progressData.total) * 100
        ));
        total = progressData.total
        loaded = Math.min(progressData.loaded, total)
        this.listeners?.onLoadProgress?.(percentLoaded)
      };
      loadingTask.promise.then(ins => {
        ins.getMetadata().then(res => console.log(res, 'download info'))
        this.pdf = ins
        this.totalPages = this.pdf._pdfInfo.numPages
        this.link.setDocument(this.pdf)
        this.findController.setDocument(this.pdf)
        this.viewer = new PDFViewer({
          container: this.pdfContainer,
          textLayerMode: 1,
          linkService: this.link,
          eventBus: this.eventBus,
          findController: this.findController,
          enableWebGL: true,
          enablePrintAutoRotate: true,
          // enablePrintAutoRotate: true,
          // renderer: "svg",
          renderInteractiveForms: true,
          ...this.renderOptions
        })
        this.link.setViewer(this.viewer)
        this.viewer.setDocument(this.pdf)
        this.viewer.renderingQueue.isThumbnailViewEnabled = true
        this.listeners?.onReady?.()
      })
    })
  }

  async printPDF(progressCb, doneCb) {
    const div = document.createElement("div");
    div.id = "printContainer";
    document.body.appendChild(div);
    const overlayContainer = document.createElement("div");
    const overlay = document.createElement("div");
    overlay.id = "printServiceOverlay";
    overlayContainer.appendChild(overlay);
    document.body.appendChild(overlayContainer);
    let printService
    const windowBeforePrint = async () => {
      printService = createPrintService(this.pdf, this.viewer.getPagesOverview(), div, null, this.eventBus);
      printService.layout();
    }
    function windowAfterPrint() {
      printService = null;
      cleanup();
    };
    function getPrintProgress(progress) {
      progressCb?.(progress);
    };
    function abortPrint() {
      abort();
      cleanup();
    };
    const cleanup = () => {
      div?.remove();
      overlayContainer?.remove();
      doneCb?.();
      this.eventBus.off("printProgressChange", getPrintProgress);
      window.removeEventListener("beforeprint", windowBeforePrint);
      window.removeEventListener("afterprint", windowAfterPrint);
    };
    this.eventBus.on("printProgressChange", getPrintProgress);
    window.addEventListener("beforeprint", windowBeforePrint);
    window.addEventListener("afterprint", windowAfterPrint);
    window.print();
    return {
      abort: abortPrint
    }
  }

  find(query, {
    highlightAll = false,
    matchDiacritics = false,
    caseSensitive = false,
    entireWord = false
  }) {
    const options = {
      type: "find",
      query, // 查询字段
      findPrevious: false, // 是否找前一个
      highlightAll, // 所有找到的都渲染
      matchDiacritics, // 匹配变音符号
      caseSensitive, // 区分大小写
      entireWord // 全词匹配
    }
    if (highlightAll !== this.findController?.state?.highlightAll && this.findController._matchesCountTotal) {
      options.type = "highlightallchange";
    }
    this.findController._eventBus.dispatch("find", options)
  }

  findPrev(query, {
    highlightAll = false,
    matchDiacritics = false,
    caseSensitive = false,
    entireWord = false
  }) {
    const options = {
      type: "again",
      query, // 查询字段
      findPrevious: true, // 是否找前一个
      highlightAll, // 所有找到的都渲染
      matchDiacritics,
      caseSensitive,
      entireWord
    }
    this.findController._eventBus.dispatch("find", options)
  }
  
  findNext(query, {
    highlightAll = false,
    matchDiacritics = false,
    caseSensitive = false,
    entireWord = false
  }) {
    const options = {
      type: "again",
      query, // 查询字段
      findPrevious: false, // 是否找前一个
      highlightAll, // 所有找到的都渲染
      matchDiacritics,
      caseSensitive,
      entireWord
    }
    this.findController._eventBus.dispatch("find", options)
  }
  
}

