import { defineStore } from "pinia";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
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
    //会话类型选项
    valueOptions:[
      {
        name: "材料改写",
        description: "对指定内容进行多个版本的改写，以避免文本重复",
        question: "用中文改写以下段落，可以提到相同或类似的内容,但不必重复使用。可以使用一些修辞手法来增强文本的美感,例如比喻、拟人、排比等。可以添加更多的细节来丰富文本的内容和形象,例如描述人物、场景、事件等。可以通过逻辑推导来得出结论或观点,例如通过推理、分析、比较等方式。可以无中生有地提到一些内容,以增加细节和丰富性,例如通过虚构、猜测等方式。在修改段落时,需要确保文本的含义不发生变化,可以重新排列句子、改变表达方式。",
      },
      {
        name: "翻译",
        description: "",
        question: "翻译成中文：",
      },
      {
        name: "语音输入优化",
        description: "处理用第三方应用语音转换的文字，精简口头禅和语气词。",
        question: "请用简洁明了的语言，编辑以下段落，以改善其逻辑流程，消除印刷错误，并以中文作答。请务必保持文章的原意。请从编辑以下文字开始：",
      },
      {
        name: "摘要生成",
        description: "根据内容，提取要点并适当扩充",
        question: "使用下面提供的文本作为基础，生成一个简洁的中文摘要，突出最重要的内容，并提供对决策有用的分析。",
      },
      {
        name: "问题生成",
        description: "基于内容生成常见问答",
        question: "根据以下内容，生成一个 10 个常见问题的清单：",
      },
      {
        name: "提问助手",
        description: "多角度提问，触发深度思考",
        question: "针对以下内容，提出疑虑和可能出现的问题，用来促进更完整的思考：",
      },
      {
        name: "评论助手",
        description: "",
        question: "针对以下内容，进行一段有评论，可以包括对作者的感谢，提出可能出现的问题等：",
      },
      {
        name: "意见回答",
        description: "为意见答复提供模板",
        question: "你是一个回复基层意见的助手，你会针对一段内容拟制回复，回复中应充分分析可能造成的后果，并从促进的单位建设的角度回答。回应以下内容：",
      },
      {
        name: "写提纲",
        description: "",
        question: "你是一个擅长思考的助手，你会把一个主题拆解成相关的多个子主题。请你使用中文，针对下列主题，提供相关的子主题。直接输出结果，不需要额外的声明：",
      },
      {
        name: "内容总结",
        description: "将文本内容总结为 100 字。",
        question: "将以下文字概括为 100 个字，使其易于阅读和理解。避免使用复杂的句子结构或技术术语。",
      },
      {
        name: "写新闻",
        description: "根据主题撰写新闻",
        question: "使用清晰、简洁、易读的语言写一篇新闻，主题为",
      },
      {
        name: "根据标题写论文",
        description: "根据主题撰写内容翔实、有信服力的论文",
        question: "根据以下主题，写一篇高度凝练且全面的论文提纲：",
      },
    ],
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
            content: "你好，有什么我能帮助您的？",
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
      }else{
        // this.zhishiku = true;
      }
      return this.messageList.find(
        (item) => item.conversationId === conversationId
      );
    },
    //打开创建会话窗口
    openConversationDialog(){
      let that = this;
      ElMessageBox.confirm("确定要新增吗？", "提示", {
        type: "warning",
      })
          .then(() => {
            that.editVisible =true
          })
          .catch(() => {
            ElMessage.success("取消成功");
          });
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
        this.messageList.unshift({
          conversationId: conversationId,
          history: [
            {
              messageId: nanoid(),
              role: "AI",
              content: "你好，有什么我能帮助您的？",
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
        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              prompt: prompt,
              keyword: "",
              temperature: this.temperature,
              top_p: this.top_p,
              max_length: this.max_length,
              history: [],
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
      this.send_raw(finallyPrompt, (data: any) => {
        onMessage(data);
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
