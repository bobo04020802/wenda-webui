import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import {useDocChatStore} from "~/store/docChat";

export const useChatStore = defineStore("chat", {
  state: () => ({
    //当前激活的对话id
    activeConversationId: "1",
    //输入框的消息
    inputMessage: "",
    //最后问模型的问题
    finallyPrompt: "",
    //是否正在发送消息
    isSending: false,
    //是否中断
    isAbort: false,
    //会话的弹出框
    editVisible: false,
    //会话类型
    converType:'',

    dialogForm :{
      name: "",
      converType: "",
    },
    rules : {
      name: [
        { required: true, message: "请输入名称", trigger: "blur" },
        { min: 3, max: 20, message: '长度在 3 到 8 个字符', trigger: 'blur' }
      ],
      converType: [
        { required: true, message: "请选择类型", trigger: "blur" },
        { min: 3, max: 50, message: '长度在 3 到 15 个字符', trigger: 'blur' }
      ],
    },
    //会话列表
    conversationList: [
      {
        conversationId: "1",
        title: "默认对话",
        converType: "知识库|内部模型",
        time: "2023-01-02 12:00:00",
        msgCount: 1,
      },
    ],
    //消息列表
    messageList: [
      {
        conversationId: "1",
        history: [
          {
            messageId: "123123",
            role: "AI",
            content: "你好，有什么我能帮助您的？我可以通过自身的模型进行回答，也可以通过打开右上角知识库按钮利用本地知识库进行学习后回答。",
            time: "2023-01-02 12:00:00",
          },
        ],
      },
    ],
    temperature: 0.9,
    max_length: 2048,
    top_p: 0.3,
    //是否使用知识库
    zhishiku: true,
    //是否显示知识库切换按钮
    on_zhishiku: true,
    //历史对话
    QA_history: [],
    //prompt模板
    promptTemplate: `system: 请扮演一名专业分析师，根据以下内容用中文回答问题：{{问题}}\n。如果您认为给出的内容和问题无关或没有提出问题，请忽略该数据内容再用中文回答。{{知识库}}`,
  }),
  getters: {},
  actions: {
    //获取某个会话的消息列表
    getMessageByConversationId(conversationId: string) {
      let cuttitem = this.conversationList.find((item) => item.conversationId === conversationId)
      if(cuttitem.converType != "知识库|内部模型" && cuttitem.converType != undefined){
        this.zhishiku = false;
        this.on_zhishiku = false;
      }else{
        this.on_zhishiku = true;
        // this.zhishiku = true;
      }
      return this.messageList.find(
        (item) => item.conversationId === conversationId
      );
    },
    //打开创建会话窗口
    openConversationDialog(){
      let that = this;
      that.editVisible =true
      // ElMessageBox.confirm("确定要新增吗？", "提示", {
      //   type: "warning",
      // })
      //     .then(() => {
      //       that.editVisible =true
      //     })
      //     .catch(() => {
      //       ElMessage.success("取消成功");
      //     });
    },
    //关闭会话窗口
    cancel() {
      this.editVisible = false;
      ElMessage.success(`取消成功！`);
    },
    //新建会话
    createConversation() {
      if(this.dialogForm.name.trim()!="" && this.dialogForm.converType != ""){
        this.editVisible = false;
        let conversationId = nanoid();
        let time = dayjs().format("YYYY-MM-DD hh:mm:ss");

        this.conversationList.unshift({
          conversationId: conversationId,
          title: this.dialogForm.name,
          converType: this.dialogForm.converType,
          time: time,
          msgCount: 1,
        });
        let docChatStore = useDocChatStore()
        let valueopt = docChatStore.valueOptions.find((item) => item.question === this.dialogForm.converType)
        this.messageList.unshift({
          conversationId: conversationId,
          history: [
            {
              messageId: nanoid(),
              role: "AI",
              content: valueopt.description,
              time: time,
            },
          ],
        });
        this.activeConversationId = conversationId;
        this.zhishiku = false;
        ElMessage.success("提交成功！");
      }else{
        ElMessage.error(`数据不能为空！`);
      }
    },
    //删除会话
    deleteConversation(conversationId: string) {
      let index = this.conversationList.findIndex(
        (item) => item.conversationId === conversationId
      );
      this.conversationList.splice(index, 1);
      this.messageList.splice(index, 1);
      //如果删除的是最后一个会话,则新建一个会话
      if (this.conversationList.length === 0) {
        this.createConversation();
      }
      //激活第一个会话
      this.activeConversationId = this.conversationList[0].conversationId;
    },
    //删除消息
    deleteMessage(messageId: string) {
      let messageList = this.getMessageByConversationId(
        this.activeConversationId
      );
      let index = messageList.history.findIndex(
        (item) => item.messageId === messageId
      );
      messageList.history.splice(index, 1);
    },
    //ws聊天实现
    async send_raw(prompt: any, onmessage: any) {
      let result = "";
      await new Promise((resolve) => {
        let apiUrl = import.meta.env.VITE_WENDA_URL;
        let ws: any;
        if (apiUrl) {
          ws = new WebSocket(apiUrl.replace("http", "ws") + "/ws");
        } else {
          ws = new WebSocket(location.origin.replace("http", "ws") + "/ws");
        }

        ws.onmessage = (event: any) => {
          result = event.data;
          //console.log(this.isAbort);
          if (!this.isAbort) {
            onmessage(result);
          } else {
            console.log("中断");

            ws.close();
          }
        };
        console.log("QA_history===",this.QA_history)
        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              prompt: prompt,
              keyword: "",
              temperature: this.temperature,
              top_p: this.top_p,
              max_length: this.max_length,
              history: this.QA_history,
            })
          );
        };
        ws.onclose = function () {
          resolve("success");
        };
      });
      onmessage("{{successEnd}}");
      return result;
    },

    //发送消息
    async sendMessage(finallyPrompt: any, onMessage: any) {
      let sendtime = dayjs().format("YYYY-MM-DD hh:mm:ss");

      //发送消息
      await this.send_raw(finallyPrompt, async (data: any) => {
        await onMessage(data);
      });
    },
    //存储文本进知识分区
    async uploadToRtst(memory_name: string, title: string, txt: any) {
      return new Promise((resolve, reject) => {
        axios
          .post(import.meta.env.VITE_WENDA_URL + "/api/upload_rtst_zhishiku", {
            memory_name: memory_name,
            title: title,
            txt: txt,
          })
          .then(function (response) {
            resolve(response.data);
          })
          .catch(function (error) {
            reject(error);
          });
      });
    },
  },
});
