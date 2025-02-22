<script setup lang="ts">
import imgAi from "~/assets/head.png";

import { ref, reactive, toRefs, defineProps, onMounted, watch } from "vue";
import axios from "axios";
import { ElMessage, ElNotification } from "element-plus";
import { useChatStore } from "~/store/chat";
import { useAppStore } from "~/store/app";
import {useDocChatStore} from "~/store/docChat";
import { storeToRefs } from "pinia";
import { useDark, useToggle } from "@vueuse/core";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import * as XLSX from 'xlsx'
import MarkdownItVue from "markdown-it-vue"
import 'markdown-it-vue/dist/markdown-it-vue.css'

import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();
const copy = async (content: string) => {
  try {
    await toClipboard(content);
    ElMessage.warning("消息复制成功");
  } catch (e) {
    console.error(e);
  }
};

const isDark = useDark();

let chatStore = useChatStore();
const { conversationList, messageList, activeConversationId } =
  storeToRefs(chatStore);
let docChatStore = useDocChatStore()
const {valueOptions} = storeToRefs(docChatStore)
let appStore = useAppStore();
const { showSide, isMobile } = storeToRefs(appStore);

const props = defineProps({
  conversationId: {
    type: String,
    required: true,
  },
});

//console.log(chatStore.getMessageByConversationId(props.conversationId));

const state = reactive({});

//发送按钮事件
const sendMessage = () => {
  //如果在发送状态则终止发送
  if (chatStore.isSending) {
    chatStore.isAbort = true;
    //console.log(chatStore.isAbort);

    chatStore.isSending = false;
    return;
  }
  if (chatStore.inputMessage.length == 0) {
    ElMessage.warning("消息不能为空");
    return;
  }
  chatStore.isAbort = false;
  chatStore.isSending = true;
  //先显示用户发送的消息
  let sendtime = dayjs().format("YYYY-MM-DD hh:mm:ss");
  let thisMessageId = nanoid();
  let messageSend = {
    messageId: thisMessageId,
    role: "user",
    content: chatStore.inputMessage,
    time: sendtime,
  };
  let messageList = chatStore.getMessageByConversationId(
    chatStore.activeConversationId
  );
  messageList.history.push(messageSend);
  //进入检索知识库流程
  getKnowledge(thisMessageId, false);
};
//重试按钮事件
const retryMessage = (messageId: string) => {
  //当前未在发送状态才能重试
  if (chatStore.isSending) {
    ElMessage.warning("当前正在发送消息，无法重试");
    return;
  }
  chatStore.isAbort = false;
  chatStore.isSending = true;
  getKnowledge(messageId, true);
};

let RomanNumeralsMap = {
  'III': 3,
  'II': 2,
  'IV': 4,
  'IX': 9,
  'XL': 40,
  'XC': 90,
  'CD': 400,
  'CM': 900,
  'I': 1,
  'V': 5,
  'X': 10,
  'L': 50,
  'C': 100,
  'D': 500,
  'M': 1000
}

function find_RomanNumerals(str) {
  let number = 0;
  for (var p in RomanNumeralsMap) {
    if (str.indexOf(p) != -1) {
      str = str.split(p).join("");
      number += RomanNumeralsMap[p];
    }
  }
  return number
}

//获取知识库数据
const getKnowledge = (parentMessageId: string, isRetry: boolean) => {
  let sendtime = dayjs().format("YYYY-MM-DD hh:mm:ss");
  let messageList = chatStore.getMessageByConversationId(
    chatStore.activeConversationId
  );
  //如果是重试
  if (isRetry) {
    //将输入框的内容设置为parentMessageId的内容
    chatStore.inputMessage = messageList.history.find(
      (i: any) => i.messageId == parentMessageId
    ).content;
  }
  let lastMsg: any;
  //如果是重试
  if (isRetry) {
    lastMsg = messageList.history.find(
      (i: any) => i.parentMessageId == parentMessageId
    );
  }
  //如果开启了知识库，则开始检索
  if (chatStore.zhishiku) {
    let messageSend = {
      messageId: nanoid(),
      role: "ui",
      content: "正在检索数据...",
      time: sendtime,
    };

    let parentIndex = messageList.history.findIndex(
      (i: any) => i.messageId == parentMessageId
    );
    //在parentMessageId后面插入消息
    messageList.history.splice(parentIndex + 1, 0, messageSend);
    let uiMsg = messageList.history[parentIndex + 1];

    //开始获取知识库
    axios
      .post(import.meta.env.VITE_WENDA_URL + "/api/find", {
        prompt: chatStore.inputMessage,
      })
      .then(function (response) {
        console.log(response.data);
        //从消息数组中删除所有role为ui的消息
        messageList.history = messageList.history.filter(
          (i: any) => i.role != "ui"
        );
        //如果已经终止发送
        if (chatStore.isAbort) {
          return;
        }
        //如果不是重试
        if (!isRetry) {
          //给机器人添加等待效果
          let messageAI = {
            messageId: nanoid(),
            role: "AI",
            content: "等待模型中...",
            time: sendtime,
            source: response.data,
            parentMessageId: parentMessageId,
          };
          let lastIndex = messageList.history.push(messageAI);
          lastMsg = messageList.history[lastIndex - 1];
        }

        //如果信息来源不为空，合并数据源并生成prompt
        if (response.data.length > 0) {
          chatStore.finallyPrompt = chatStore.promptTemplate
            .replace("{{问题}}", chatStore.inputMessage)
            .replace(
              "{{知识库}}",
              response.data.map((i: any) => i.content).join("\n")
            );
        } else {
          chatStore.finallyPrompt = chatStore.inputMessage;
        }

        chatStore.sendMessage(chatStore.finallyPrompt, (data: any) => {
          if (data != "{{successEnd}}") {
            lastMsg.content = data;
          } else {
            chatStore.inputMessage = "";
            chatStore.isSending = false;
          }
        });
      })
      .catch(function (error) {
        console.log(error);
        uiMsg.content = "检索数据失败";
      });
  } else {
    //给机器人添加等待效果
    let messageAI = {
      messageId: nanoid(),
      role: "AI",
      content: "等待模型中...",
      time: sendtime,
      source: [],
      parentMessageId: parentMessageId,
    };
    //如果不是重试
    if (!isRetry) {
      let lastIndex = messageList.history.push(messageAI);
      lastMsg = messageList.history[lastIndex - 1];
    }
    //生成prompt
    let cuttitem = chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)
    let valueopt = docChatStore.valueOptions.find((item) => item.question === cuttitem.converType);
    // console.log(valueopt)
    if(valueopt != undefined && valueopt.fun_ != undefined && typeof valueopt.fun_ == 'function'){
      let tempfun_ = valueopt.fun_;
      tempfun_(chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry);
    }else{
      if(cuttitem.converType != "知识库|内部模型" && cuttitem.converType != undefined){
        // console.log(chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId).converType)
        chatStore.finallyPrompt = cuttitem.converType + chatStore.inputMessage;
      }else{
        chatStore.finallyPrompt = chatStore.inputMessage;
      }

      chatStore.sendMessage(chatStore.finallyPrompt, (data: any) => {
        if (data != "{{successEnd}}") {
          lastMsg.content = data;
        } else {
          chatStore.inputMessage = "";
          chatStore.isSending = false;
        }
      });
    }
  }
};
//删除消息
const deleteMessage = (messageId: string) => {
  //当前未在发送状态才能删除
  if (chatStore.isSending) {
    ElMessage.warning("当前正在发送消息，无法删除");
    return;
  }
  chatStore.deleteMessage(messageId);
};

const fileDownload = (res, filename) => {
  let blob = new Blob([res.data]); // 将返回的数据通过Blob的构造方法，创建Blob对象
  if ('msSaveOrOpenBlob' in navigator) {
    window.navigator.msSaveOrOpenBlob(blob, filename); // 针对浏览器
  } else {
    const elink = document.createElement('a'); // 创建a标签
    elink.download = filename;
    elink.style.display = 'none';
    // 创建一个指向blob的url，这里就是点击可以下载文件的根结
    elink.href = URL.createObjectURL(blob);
    document.body.appendChild(elink);
    elink.click();
    URL.revokeObjectURL(elink.href); //移除链接
    document.body.removeChild(elink); //移除a标签
  }
}

//生成PPT
const genPPT = async (content: string) => {
  let response
  try {
    response = await axios
        .post(import.meta.env.VITE_WENDA_URL + "/api/genppt", {
          content: content,
        })
    console.log(response)
    axios({
      url: import.meta.env.VITE_WENDA_URL + "/api/downloadppt?outputfile=" + response.data,
      method: 'get',
      responseType: 'blob'
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'output.pptx');
      document.body.appendChild(link);
      link.click();
    });
    // fileDownload(response, 'output.pptx')
  }catch(e){
    ElMessage.warning("生成PPT出错");
  }

};

//生成xlsx
const genEXCEL =  async (content: string, key) => {
  const tableDom = document.querySelector('#'+key).querySelector('table')
  // console.log(tableDom)
  const workbook = XLSX.utils.table_to_book(tableDom)
  // console.log(workbook)
  //  文件名带后缀
  XLSX.writeFileXLSX(workbook, '数据.xlsx')
};

const dialogFormVisible = ref<boolean>(false)
const activeswdt = ref<string>('')
const activeechart = ref<object>({})
const dialogEchartVisible = ref<boolean>(false)
const openSWDT = (content: string) => {
  dialogFormVisible.value=true
  activeswdt.value = content
};

const openEcharts = (content: string) => {
  dialogEchartVisible.value=true
  let matchReg = /(?<=```echarts).*?(?=.```)/igs;
  let svgvalue = content.match(matchReg)
  let regR = /\r/g;
  let regN = /\n/g;
  console.log('bbbbb===',svgvalue[0].replace(regR,"").replace(regN,"").replaceAll("\'", '\"').replaceAll(" ", ''))
  // console.log(svgvalue[0].replace(regR,"").replace(regN,"").replaceAll("\"", '').replaceAll(" ", ''))
  activeechart.value = JSON.parse('{"width":500,"height":400,"xAxis":{"type":"category","data":["2017","2018","2019","2020"]},"yAxis":{"type":"value"},"series":[{"name":"GDP","type":"bar","data":[5385.72,5291.25,5085.83,4861.48]},{"name":"通货膨胀率","type":"bar","data":[6.1,6.1,-2.6,-2.7]},{"name":"失业率","type":"bar","data":[5.2,5.3,5.8,5.7]}]}')
  console.log('aaaaaaaaaa===',activeechart.value)
};

//收到消息自动滚动到底部
const chatScroll = ref(null);
const chatInner = ref(null);
onMounted(() => {
  chatScroll.value.setScrollTop(chatInner.value.scrollHeight);
  setInterval(() => {
    if (chatStore.isSending) {
      chatScroll.value.setScrollTop(chatInner.value.scrollHeight);
    }
  }, 100);
});
//切换会话自动滚动到底部
watch(
  () => chatStore.activeConversationId,
  () => {
    console.log("切换会话");

    setTimeout(() => {
      chatScroll.value.setScrollTop(chatInner.value.scrollHeight);
    }, 500);
  }
);
//获取消息在不同状态下的背景颜色
const getMsgBackColor = (role: string) => {
  if (role == "user") {
    return isDark.value ? "#303133" : "#e4f5fc";
  } else {
    return isDark.value ? "#202020" : "#f2f6fc";
  }
};
//跳转到数据来源
const jumpToSource = (content: any) => {
  content = content.title;

  let regex = /\[.*?\]\((.*?)\)/;
  let matches = content.match(regex);
  if (matches && matches.length > 1) {
    let extractedLink = matches[1];
    console.log(`URL: ${extractedLink}`);
    if (extractedLink.indexOf("http") != -1) {
      window.open(extractedLink);
    } else {
      extractedLink = import.meta.env.VITE_WENDA_URL + extractedLink;
      window.open(extractedLink);
    }
  } else {
    ElMessage.warning("该来源无法直接打开！");
  }
};
const getSorceInfo = (content: any, type: string) => {
  if (type == "title" || type == "url") {
    content = content.title;

    let regex = /\[.*?\]\((.*?)\)/;
    let matches = content.match(regex);
    if (matches && matches.length > 1) {
      const extractedLink = matches[1];

      if (type == "title") {
        let regex1 = /\[(.*?)\]\([^)]*\)/;
        let matches1 = content.match(regex1);

        if (matches1 && matches1.length >= 2) {
          const fileName = matches1[1];
          return fileName;
        } else {
          console.log("未找到文件名");
          return "未找到文件名";
        }
      } else if (type == "url") {
        return extractedLink;
      }
    } else {
      return content;
    }
  } else if (type == "content") {
    return content.content;
  }
};
//自动复制上条发送的消息内容到编辑框
const copyLastMessage = () => {
  //当前未在发送状态才能复制
  if (chatStore.isSending) {
    ElMessage.warning("当前正在发送消息，无法操作");
    return;
  }
  try {
    //取到上条用户发送的消息内容
    let messageList = chatStore.getMessageByConversationId(
      chatStore.activeConversationId
    );
    let lastMsgContent = messageList.history
      .filter((i: any) => i.role == "user")
      .pop().content;
    //复制到编辑框
    chatStore.inputMessage = lastMsgContent;
  } catch (error) {
    ElMessage.warning("没有取到上条消息！");
  }
};
let proofImage;
const getFile = (file, fileList) => {
  getBase64(file.raw).then(res => {
    const params = res
    console.log(params)
    chatStore.inputMessage = params
  })
};

const getBase64 = (file) => {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader()
    let imgResult = ''
    reader.readAsDataURL(file)
    reader.onload = function () {
      imgResult = reader.result
    }
    reader.onerror = function (error) {
      reject(error)
    }
    reader.onloadend = function () {
      resolve(imgResult)
    }
  })
};

const handleUploadRemove = (file, fileList) => {
  chatStore.inputMessage = ''
};

const handlePictureCardPreview = (file) => {
};


//const { circleUrl, squareUrl, sizeList } = toRefs(state);
</script>

<template>
  <el-scrollbar
    style="padding: 0px 20px 0px 0px; height: calc(100vh - 200px)"
    ref="chatScroll"
  >
    <div ref="chatInner">
      <!-- 聊天内容 -->
      <transition
        name="el-zoom-in-top"
        v-for="message in chatStore.getMessageByConversationId(
          props.conversationId
        )?.history"
        :key="
          chatStore.getMessageByConversationId(props.conversationId)
            ?.conversationId
        "
      >
        <div
          style="display: flex; width: 100%; margin-bottom: 10px"
          :style="{
            justifyContent: message.role == 'user' ? 'flex-end' : 'flex-start',
          }"
        >
          <!-- 系统提示消息 -->
          <div
            v-if="message.role == 'ui'"
            style="
              font-size: 12px;
              margin-left: 40px;
              font-weight: bolder;
              opacity: 0.5;
            "
          >
            {{ message.content }}
            <br>
          </div>
          <el-popover
            placement="top"
            :width="200"
            trigger="hover"
            :popper-style="{
              padding: '3px',
              width: 'auto',
            }"
          >
            <div
              style="width: 100%; display: flex; justify-content: space-around"
            >
              <el-button
                size="small"
                type="danger"
                plain
                @click="deleteMessage(message.messageId)"
                >删除</el-button
              >
              <el-button
                size="small"
                type="primary"
                plain
                @click="copy(message.content)"
                >复制</el-button
              >
              <el-button
                  size="small"
                  type="primary"
                  plain
                  v-if="message.role == 'AI' && (message.content ? message.content.indexOf('```')> -1 : false ) && (chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '根据主题帮我出一个思维导图' || chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '根据主题帮我出一个产业链图谱')"
                  @click="openSWDT(message.content)"
              >思维导图</el-button
              >

              <el-button
                  size="small"
                  type="primary"
                  plain
                  v-if="message.role == 'AI' && (message.content ? message.content.indexOf('```echarts')> -1 : false ) && chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '根据主题帮我出一个echart图'"
                  @click="openEcharts(message.content)"
              >生成图表</el-button>

              <el-button
                  size="small"
                  type="primary"
                  plain
                  v-if="message.role == 'AI' && (chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '你将作为一个PPT文档生成器去完成下面的内容' || chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '根据提纲生成ppt')"
                  @click="genPPT(message.content)"
              >生成PPT</el-button
              >
              <el-button
                  size="small"
                  type="primary"
                  plain
                  v-if="message.role == 'AI' && (chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '我希望你能提取下面内容中的数字以及数值对应的指标，如果不存在则回答:无，指标和数值中不能涵盖符号，如果有符号请拆分为多个指标和数值，指标内容不重复，按照表格形式回复，表格有两列且表头为(指标，数据)：')"
                  @click="genEXCEL(message.content,message.messageId)"
              >生成excel</el-button>
              <el-button
                size="small"
                type="warning"
                plain
                v-if="message.role == 'user'"
                @click="retryMessage(message.messageId)"
                >重试</el-button
              >
            </div>
            <template #reference>
              <div style="display: flex" v-if="message.role != 'ui'">
                <div v-if="message.role == 'AI'" style="margin-right: 10px">
                  <!-- <Logo
                    :width="30"
                    :height="30"
                    :color="isDark ? 'white' : 'black'"
                  /> -->
                  <img
                    :src="imgAi"
                    alt=""
                    style="width: 25px; mix-blend-mode: multiply"
                    :style="{
                      filter: isDark ? 'invert(0)' : 'invert(0)',
                    }"
                  />
                </div>
                <el-card
                  shadow="hover"
                  style="padding: 0px !important"
                  :style="{
                    backgroundColor: getMsgBackColor(message.role),
                    maxWidth: isMobile
                      ? 'calc(100vw - 100px)'
                      : 'calc((100vw - 100px) / 2)',
                  }"
                  :body-style="{
                    padding: '5px',
                  }"
                  @mouseover=""
                >
                  <v-md-preview
                    :text="message.content"
                    style="background-color: transparent"
                    :id="message.messageId"
                    v-if="message.content.indexOf('data:image/')<0"
                  ></v-md-preview>
                  <img :src="message.content" style="width: 100%" v-if="message.content.indexOf('data:image/')>-1" />
<!--                  <MarkdownItVue :id="message.messageId" class="md-body" :content="message.content" v-if="message.content.indexOf('```echarts')>-1" />-->
<!--                  <MarkdownIt :markdid_="'a'+message.messageId" class="md-body" :value="message.content" v-if="message.content.indexOf('```echarts')>-1"/>-->

                  <div
                      v-if="message.source || message.source? message.source.length>0 : false"
                    style="
                      width: 100%;
                      display: flex;
                      justify-content: flex-start;
                      flex-wrap: wrap;
                    "
                  >
                    <el-table :data="message.source"  style="width: 100%" :header-cell-style="{ background: '#0080D0', color:'#000000'}">
                      <el-table-column prop="title" label="数据来源-标题" style="width: 15%" :show-overflow-tooltip='true'></el-table-column>
                      <el-table-column prop="content" label="数据来源-内容" style="width: 80%"  :show-overflow-tooltip='true'></el-table-column>
                      <el-table-column prop="score" label="得分" width="100px" :show-overflow-tooltip='true'></el-table-column>
                    </el-table>

                    <el-popover
                      v-for="source in message.source"
                      placement="top-start"
                      :title="`数据来源:${getSorceInfo(source, 'title')}`"
                      :width="500"
                      trigger="hover"
                      :content="getSorceInfo(source, 'content')"
                    >
                      <template #reference>
                        <el-tag
                          style="margin: 5px; cursor: pointer"
                          @click="jumpToSource(source)"
                          :style="{
                            cursor:
                              source.title.indexOf(`](http`) != -1
                                ? 'pointer'
                                : 'default',
                          }"
                        >
                          <el-text
                            style="max-width: 130px"
                            truncated
                            :style="{
                              textDecoration:
                                source.title.indexOf(`](http`) != -1
                                  ? 'underline'
                                  : 'none',
                            }"
                            >{{ getSorceInfo(source, "title") }}</el-text
                          >
                        </el-tag>
                      </template>
                    </el-popover>
                  </div>
                </el-card>
              </div>
            </template>
          </el-popover>
        </div>
      </transition>
      <el-dialog append-to-body v-model="dialogFormVisible" v-if="dialogFormVisible" title="思维导图" style="height: 60vh;">
        <MarkmapSVG :value="activeswdt"></MarkmapSVG>
      </el-dialog>
      <el-dialog append-to-body v-model="dialogEchartVisible" v-if="dialogEchartVisible" title="图表" style="height: 60vh;">
        <CurrentEcharts :myOption="activeechart"></CurrentEcharts>
      </el-dialog>
    </div>
  </el-scrollbar>
  <div
    style="position: fixed; bottom: 10px"
    :style="{ width: showSide ? 'calc(100% - 370px)' : 'calc(100% - 40px)' }"
  >
    <el-input
      :rows="4"
      type="textarea"
      v-model="chatStore.inputMessage"
      placeholder="请输入内容。方向上键传入上次消息。Ctrl+Enter直接发送"
      resize="none"
      input-style="padding-right: 120px"
      @keyup.up="copyLastMessage()"
      @keyup.ctrl.enter="sendMessage()"
      :disabled="chatStore.isSending || chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '根据您上传的图片分析里面的内容'"
    >
    </el-input>
    <el-upload
        v-if="chatStore.conversationList.find((item) => item.conversationId === chatStore.activeConversationId)?.converType === '根据您上传的图片分析里面的内容'"
        style="position: absolute;top: 30px;left: 20px"
        action=''
        accept=".jpg, .png"
        :limit="1"
        :auto-upload="false"
        :file-list="fileList"
        :on-change="getFile"
        :on-preview="handlePictureCardPreview"
        :on-remove="handleUploadRemove"
    >
      <el-button size="small" plain :color="chatStore.isSending ? '#ef534f' : '#79b7d1'" round type="primary" @click="uploadimg">选择图片上传</el-button>
    </el-upload>
    <el-button
      round
      :color="chatStore.isSending ? '#ef534f' : '#79b7d1'"
      :dark="isDark"
      plain
      style="position: absolute; right: 10px; top: 30px"
      @click="sendMessage()"
    >
      {{ chatStore.isSending ? "终止" : "发送" }}
    </el-button>
  </div>
</template>

<style></style>
