<template>
  <el-menu
    class="el-menu-vertical-demo"
    :collapse="false"
    @open="handleOpen"
    @close="handleClose"
    :style="{ backgroundColor: isDark ? '#000' : '#e4f5fc' }"
  >
    <div style="padding: 40px 0px 40px 30px; width: 300px">
      <div style="display: flex; justify-content: flex-start">
        <el-text style="font-size: 20px; font-weight: bolder">
          {{ title }}
        </el-text>
      </div>
      <div style="display: flex; justify-content: flex-start">
        <el-text style="font-size: 15px; opacity: 0.5">
          {{ subtitle }}
        </el-text>
      </div>
    </div>

    <!-- 机器人logo -->
    <div
      style="position: absolute; opacity: 1; top: 0px; right: 0px; z-index: 999"
      v-if="!isMobile"
    >
      <img
        :src="imgRobot"
        alt=""
        style="width: 120px; mix-blend-mode: multiply"
      />
    </div>

    <!-- 移动端菜单展开才会显示按钮 -->
    <div
      @click="toggleSide()"
      style="width: 60px; position: absolute; top: 0px; right: 0px"
      v-if="isMobile && showSide"
    >
      <button
        class="border-none w-full bg-transparent cursor-pointer"
        style="height: var(--ep-menu-item-height); padding-top: 8px"
      >
        <i inline-flex i="ep-close" v-if="showSide" />
        <i inline-flex i="ep-operation" v-if="!showSide" />
      </button>
    </div>

    <el-scrollbar
      style="padding: 0px 20px 10px 20px; height: calc(100% - 240px)"
    >
      <div
        v-for="conversation in conversationList"
        :key="conversation.conversationId"
        style="height: 63px"
        @mouseover="hoverConversationId = conversation.conversationId"
        @mouseleave="hoverConversationId = ''"
      >
        <el-card
          shadow="never"
          style="
            width: auto;
            height: 60px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
            position: relative;
          "
          :style="{
            border:
              conversation.conversationId == activeConversationId
                ? '2px solid #aaa'
                : '0',
          }"
          :body-style="{
            padding: 0,
          }"
          @click="activeConversationId = conversation.conversationId"
        >
          <div style="width: auto; padding: 5px">
            <div
              style="
                display: flex;
                justify-content: flex-start;
                padding: 0px 5px;
              "
            >
              <el-text style="font-weight: bold; text-align: start" truncated
                >{{ conversation.title }}
              </el-text>
            </div>

            <div
              style="
                display: flex;
                justify-content: space-between;
                padding: 5px;
              "
            >
              <el-text
                >{{
                  getConversationHistoryCount(conversation.conversationId)
                }}条记录</el-text
              >
              <el-text>{{ conversation.time }}</el-text>
            </div>
          </div>
          <el-popconfirm
            title="确认要删除这个对话?"
            confirm-button-text="是"
            cancel-button-text="否"
            @confirm="chatStore.deleteConversation(conversation.conversationId)"
          >
            <template #reference>
              <el-button
                v-show="conversation.conversationId == hoverConversationId"
                size="small"
                type="danger"
                plain
                style="position: absolute; top: 18px; right: 10px"
                >删除</el-button
              >
            </template>
          </el-popconfirm>
        </el-card>
      </div>
    </el-scrollbar>
    <div>
      <el-text style="font-size: 12px; opacity: 0.5">
        共{{ conversationList.length }}个会话
      </el-text>
    </div>
    <div
      style="
        display: flex; justify-content: space-evenly; align-items: center; width: 100%; margin-top: 10px
      "
    >
      <el-button
        @click="chatStore.openConversationDialog()"
        style="width: 35%; height: 45px;  border: none"
        >新建会话</el-button
      >
      <el-button @click="chatDocument = true" style="width: 35%; height: 45px; border: none"
        >文档对话</el-button
      >
    </div>
  </el-menu>
  <el-dialog title="会话信息" v-model="editVisible" width="35%">
    <el-form label-width="100px" ref="formData" :rules="rules" :model="dialogForm">
      <el-form-item label="会话名称" prop="name" clearable>
        <el-input v-model="dialogForm.name"></el-input>
      </el-form-item>
      <el-form-item label="会话类型" prop="converType" clearable>
        <el-select v-model="dialogForm.converType">
          <el-option
              v-for="item in valueOptions"
              :key="item.name"
              :label="item.name"
              :value="item.question"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
       <span class="dialog-footer">
             <el-button @click="chatStore.cancel">取 消</el-button>
             <el-button type="primary" @click="chatStore.createConversation()">确 定</el-button>
       </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import imgRobot from "~/assets/robot.png";

import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useChatStore } from "~/store/chat";
import {useDocChatStore} from "~/store/docChat";
import { useDark, useToggle } from "@vueuse/core";
import { relative } from "path";

import { useAppStore } from "~/store/app";
let appStore = useAppStore();
const { showSide, isMobile, chatDocument } = storeToRefs(appStore);
const {valueOptions} = useDocChatStore()
const isDark = useDark();

const isCollapse = ref(true);
const title = ref(import.meta.env.VITE_APP_TITLE);
const subtitle = ref(import.meta.env.VITE_APP_SUBTITLE);

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
let chatStore = useChatStore();
const { conversationList, messageList, activeConversationId, editVisible, converType, dialogForm, rules } =
  storeToRefs(chatStore);
activeConversationId.value = messageList.value[0].conversationId;

//会话删除按钮
const hoverConversationId = ref("");
const getConversationHistoryCount = (conversationId: string) => {
  let msgList = messageList.value.filter((message) => {
    return message.conversationId == conversationId;
  });
  return msgList[0].history.length;
};
const toggleSide = () => {
  console.log(appStore.showSide);

  appStore.showSide = !appStore.showSide;
};
</script>
<style lang="scss"></style>
