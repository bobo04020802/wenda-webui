<script lang="ts" setup>
import { ElMessage, ElMessageBox } from "element-plus";
import { toggleDark } from "~/composables";
import { ref, reactive, getCurrentInstance } from "vue";

import { useChatStore } from "~/store/chat";
import { storeToRefs } from "pinia";
let chatStore = useChatStore();
const { zhishiku,on_zhishiku } = storeToRefs(chatStore);

import { useAppStore } from "~/store/app";
let appStore = useAppStore();
const { showSide, isMobile } = storeToRefs(appStore);

const about = () => {
  ElMessageBox.alert(
    `
  本项目是专为 <a href="https://github.com/bobo04020802/berheley_LLM" target="_blank">BerheleyLLM</a> 设计的webui。<br>
  本项目git地址： <a href="https://github.com/bobo04020802/wenda-webui" target="_blank">berheley-webui</a>
  `,
    "关于本项目",
    {
      dangerouslyUseHTMLString: true,
    }
  );
};
const settingsDialog = ref();
const currentInstance = getCurrentInstance();
const settings = () => {
  //console.log(currentInstance.ctx.$refs.settingsDialog.visible);
  currentInstance.ctx.$refs.settingsDialog.visible = true;
};
const settingsDisplay = ref(false);
const reactiveObj = reactive({
  settingsDisplay,
});
const toggleSide = () => {
  console.log(appStore.showSide);

  appStore.showSide = !appStore.showSide;
};
</script>

<template>
  <div style="display: flex; border-bottom: 1px solid #ccc; width: 100%">
    <div style="width: 300px; display: flex; align-items: center">
      <div @click="toggleSide()" style="width: 60px">
        <button
          class="border-none w-full bg-transparent cursor-pointer"
          style="height: var(--ep-menu-item-height); padding-top: 8px"
        >
          <i inline-flex i="ep-close" v-if="showSide" />
          <i inline-flex i="ep-operation" v-if="!showSide" />
        </button>
      </div>
      <span>聊天</span>
    </div>
    <div style="display: flex; justify-content: end; width: 100%">
      <div style="display: flex; margin-right: 20px" v-if="on_zhishiku">
        <el-switch
          v-model="zhishiku"
          style="margin-left: 5px; margin-top: 12px"
          inline-prompt
          active-text="知识库"
          inactive-text="知识库"
        />
      </div>
      <button
        class="border-none bg-transparent cursor-pointer"
        @click="settings()"
      >
        <span v-if="!isMobile">设置</span>
        <i v-if="isMobile" inline-flex i="ep-setting" />
      </button>
      <div @click="toggleDark()" style="width: 60px">
        <button
          class="border-none w-full bg-transparent cursor-pointer"
          style="height: var(--ep-menu-item-height)"
        >
          <i inline-flex i="dark:ep-moon ep-sunny" />
        </button>
      </div>
      <button
        class="border-none bg-transparent cursor-pointer"
        @click="about()"
        style="margin-right: 20px; display: none"
      >
        <span v-if="!isMobile">关于</span>
        <i v-if="isMobile" inline-flex i="ep-star" />
      </button>
    </div>
  </div>
  <Settings ref="settingsDialog"></Settings>
</template>
