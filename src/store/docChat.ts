import {defineStore, storeToRefs} from "pinia";
import {nanoid} from "nanoid";
import axios from "axios";
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view/dist/index.esm';
import {ref} from "vue";
export const useDocChatStore = defineStore("docChat", {
  state: () => ({
    //文档对话的知识库id
    doc_id: "",
    //文档对话的消息列表
    messageList: [
      {
        messageId: "123123",
        role: "AI",
        content:
          "你好，请上传文档，然后和我对话。我可以帮您总结文档，您也可以询问我文档中的信息！",
        time: "2023-01-02 12:00:00",
      },
    ],
    //会话类型选项
    valueOptions:[
      {
        name: "普通知识库",
        description: "你好，有什么我能帮助您的？我可以通过自身的模型进行回答，也可以通过打开右上角知识库按钮利用本地知识库进行学习后回答。",
        question: "知识库|内部模型",
        fun_: "不是方法",
      },
      {
        name: "内容到表格",
        description: "你好，有什么我能帮助您的？我可以将非结构化的文本数据生成结构化的表格数据。输出结果类似：\n| 指标 | 数据 |\n|  --- | --- |\n| 设施蔬菜 | 4.3% |\n| 水果产量 | 5% |\n| 生猪出栏 | 1140万头 |",
        question: "我希望你能提取下面内容中的数字以及数值对应的指标，如果不存在则回答:无，指标和数值中不能涵盖符号，如果有符号请拆分为多个指标和数值，指标内容不重复，按照表格形式回复，表格有两列且表头为(指标，数据)：",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.QA_history = [{ "role": "user", "content": "我希望你能提取下面内容中的数字以及数字对应的指标，如果不存在则回答:无，指标和数值中不能涵盖符号，如果有符号请拆分为多个指标和数值，指标内容不重复，按照表格形式回复，表格有两列且表头为(指标，数据)：：前5个月，设施蔬菜、水果产量分别增长4.3%和5%。畜牧业生产稳定向好，生猪出栏1140万头、增长3%，肉、奶产量分别增长3%和5%，蛋产量持平。渔业生产持续向好，水产品总产量增长3.9%。上半年，预计农业增加值增长4%左右。" },
            { "role": "AI", "content": '| 指标 | 数据 |\n|  --- | --- |\n| 设施蔬菜 | 4.3% |\n| 水果产量 | 5% |\n| 生猪出栏 | 1140万头 |\n| 生猪出栏 | 3% |\n| 肉 | 3% |\n| 奶 | 5% |\n| 水产品总产量 | 3.9% |\n| 农业增加值 | 4% |\n' }]
          chatStore.sendMessage("我希望你能提取下面内容中的数字以及数字对应的指标，如果不存在则回答:无，指标和数值中不能涵盖符号，如果有符号请拆分为多个指标和数值，指标内容不重复，按照表格形式回复，表格有两列且表头为(指标，数据)：" + chatStore.inputMessage, (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = []
              chatStore.inputMessage = "";
              chatStore.isSending = false;
            }
          })
        },
      },
      {
        name: "生成图片",
        description: "您好，我可以根据您输入的内容生成一张图片",
        question: "您好，我可以根据您输入的内容生成一张图片",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.QA_history = [{ "role": "user", "content": "将内容翻译成英文，单词之间用横线隔开：猴子" },
            { "role": "AI", "content": 'monkey' },{ "role": "user", "content": "将内容翻译成英文，单词之间用横线隔开：一朵鲜花" },
            { "role": "AI", "content": 'A flower' },{ "role": "user", "content": "将内容翻译成英文，单词之间用横线隔开：a large building" },
            { "role": "AI", "content": 'a large building' },{ "role": "user", "content": "将内容翻译成英文，单词之间用横线隔开：阴暗的天空" },
            { "role": "AI", "content": 'a leaden sky' },{ "role": "user", "content": "将内容翻译成英文，单词之间用横线隔开：一个金发男孩骑着大象" },
            { "role": "AI", "content": 'A golden haired boy riding an elephant' }]
          chatStore.sendMessage("将内容翻译成英文，单词之间用横线隔开：" + chatStore.inputMessage, async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = [{ "role": "user", "content": "根据下面的内容查找图片：monkey" },
                { "role": "AI", "content":
                      '![a monkey](https://source.unsplash.com/random/960x640/?monkey)'
                      },{ "role": "user", "content": "根据下面的内容查找图片：A flower" },
                { "role": "AI", "content":
                      '![a A,flower](https://source.unsplash.com/random/960x640/?A,flower)'},
                { "role": "user", "content": "根据下面的内容查找图片：building" },
                { "role": "AI", "content":
                      '![a building](https://source.unsplash.com/random/960x640/?building)'
                       },
                { "role": "user", "content": "根据下面的内容查找图片：a,heavy,rain" },
                { "role": "AI", "content":
                      '![a a,heavy,rain](https://source.unsplash.com/random/960x640/?a,heavy,rain)'
                },
                { "role": "user", "content": "根据下面的内容查找图片：A,golden,haired,boy,riding,an,elephant" },
                { "role": "AI", "content":
                      '![a A,golden,haired,boy,riding,an,elephant](https://source.unsplash.com/960x640/?A,golden,haired,boy,riding,an,elephant)'
                }]
              await chatStore.sendMessage("根据下面的内容查找图片：" + lastMsg.content.replaceAll('An ', '').replaceAll('an ', '').replaceAll('A ', '').replaceAll('a ', '').replaceAll(' ', ','), (data: any) => {
                if (data != "{{successEnd}}") {
                  lastMsg.content = data;
                } else {
                  chatStore.QA_history = []
                  chatStore.inputMessage = "";
                  chatStore.isSending = false;
                }
              })
            }
          })
        },
      },
      {
        name: "分析图片",
        description: "您好，我可以根据您上传的图片分析里面的内容",
        question: "根据您上传的图片分析里面的内容",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let formData = new FormData();
          formData.append("imgbase64", chatStore.inputMessage);
          let config = {
            method: 'post',
            url: import.meta.env.VITE_WENDA_URL + "/api/imganalysis",
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            maxBodyLength: Infinity,
            maxContentLength: Infinity, //无穷大
            data: formData
          }
          let promptc = await axios(config)
          console.log(promptc.data)
          chatStore.sendMessage(promptc.data, async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = []
              chatStore.inputMessage = "";
              chatStore.isSending = false;
            }
          })
        },
      },
      {
        name: "产业规划",
        description: "你好，有什么我能帮助您的？我可以根据主题撰写内容翔实、有信服力的产业规划报告，您只需要输入想要的产业规划名称即可，此报告完全利用模型本身进行输出。",
        question: "你将作为一个产品经理，进行产业链分析，并绘制产业链结构表",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.sendMessage("你将作为一个产品经理，进行产业规划，重点分析产业链，越详尽越好，根据以下主题，写一篇高度凝练且全面的产业报告提纲，直接输出结果，不需要额外的声明：" + chatStore.inputMessage,  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n")]
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
                  if(i==resp.length-1){
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
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
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                  continue  // 判断非提纲内容
                }
                content.push(resp[i])   // 保存提纲
                let num = find_RomanNumerals(line[0])
                if (num <= 0 || num == 100) {
                  let messageAI = {
                    messageId: nanoid(),
                    role: "user",
                    content: line[1],
                    time: sendtime,
                    source: [],
                    parentMessageId: parentMessageId,
                  };
                  //如果不是重试
                  if (!isRetry) {
                    let lastIndex = messageList.history.push(messageAI);
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  messageAI = {
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
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  await chatStore.sendMessage("根据主题：" + chatStore.inputMessage +
                      "\n对下列段落进行详细的撰写：" + line[1], (data: any) => {
                    if (data != "{{successEnd}}") {
                      lastMsg_.content = data;
                    } else {
                      content.push(lastMsg_.content + "\n\n");
                      if(i==resp.length-1){
                        let messageAI = {
                          messageId: nanoid(),
                          role: "user",
                          content: chatStore.inputMessage,
                          time: sendtime,
                          source: [],
                          parentMessageId: parentMessageId,
                        };
                        //如果不是重试
                        if (!isRetry) {
                          let lastIndex = messageList.history.push(messageAI);
                          lastMsg = messageList.history[lastIndex - 1];
                        }
                        messageAI = {
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
                        content = content.join("\n\n");
                        lastMsg.content = content
                        chatStore.inputMessage = "";
                        chatStore.isSending = false;
                      }
                    }
                  })
                }
              }
            }
          })
        },
      },
      {
        name: "生成ppt",
        description: "你好，有什么我能帮助您的？我可以根据主题撰写内容翔实、有信服力的PPT报告，您只需要输入想要的业务名称即可，此业务内容完全利用模型本身进行输出。",
        question: "你将作为一个PPT文档生成器去完成下面的内容",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.QA_history = [{ "role": "user", "content": "帮我生成一份不多于6条记录的PPT目录，主题是如何开一家面包店，用 markdown 格式以分点叙述的形式输出" },
            { "role": "AI", "content": '# 如何开好一家面包店\n\n### 目录\n\n* 1. 市场调研\n\n* 2. 店铺选址\n\n* 3. 品牌设计和包装\n\n' },{ "role": "user", "content": "帮我生成一份不多于6条记录的PPT目录，主题是如何开发一个软件，用 markdown 格式以分点叙述的形式输出" },
            { "role": "AI", "content": '# 如何开发一个软件\n\n### 目录\n\n* 1. 确定软件的目标和功能\n\n* 2. 收集用户需求\n\n* 3. 设计软件架构\n\n* 4. 编写代码和测试\n\n* 5. 部署和发布n\n* 6. 持续迭代和升级\n\n' }]
          chatStore.sendMessage("帮我生成一份不多于6条记录的PPT目录，主题是" + chatStore.inputMessage + '，用 markdown 格式以分点叙述的形式输出',  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = []
              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n")]
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
                  if(i==resp.length-1){
                    chatStore.QA_history = []
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
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
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                  continue  // 判断非提纲内容
                }
                content.push(resp[i].replace('* ', '## '))   // 保存提纲
                let num = find_RomanNumerals(line[0])
                if (num <= 0 || num == 100) {
                  let messageAI = {
                    messageId: nanoid(),
                    role: "user",
                    content: line[1],
                    time: sendtime,
                    source: [],
                    parentMessageId: parentMessageId,
                  };
                  //如果不是重试
                  if (!isRetry) {
                    let lastIndex = messageList.history.push(messageAI);
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  messageAI = {
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
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  chatStore.QA_history = [{ "role": "user", "content": "根据主题：如何开一家面包店，\n控制在300字以内对下列段落进行撰写，直接输出结果，不需要额外的声明：市场调研，用 markdown 格式以分点叙述的形式输出" },
                    { "role": "AI", "content": '### 1. 调查目标市场\n\n' +
                          '* 在开一家面包店之前,我们需要先调查我们的目标市场。我们需要了解我们的目标客户是谁,他们的需求和喜好是什么,以及市场竞争情况等等。\n' +
                          '\n' +
                          '* 我们需要了解当地人口结构、收入水平、消费习惯、购买力以及竞争对手的面包店数量和规模等情况。同时,我们还需要了解目标市场的消费趋势,特别是在年轻人、家庭和糖尿病患者等人群中的趋势。\n' +
                          '\n' +
                          '* 通过这些调查,我们可以更好地了解市场需求,以及确定我们的目标市场。\n' +
                          '\n' +
                          '### 2. 研究竞争对手\n\n' +
                          '* 研究竞争对手是开一家面包店前必须要做的事情，\n' +
                          '\n' +
                          '### 3. 选择合适的地点\n\n' +
                          '* 选择合适的地点也是成功开设面包店的关键。应该选择人流量大、消费水平高、竞争少的地理位置\n' +
                          '* 如果开设在繁华的商业街上，可以吸引更多的顾客。如果选择开设在社区或住宅区附近，可以吸引到更多的家庭和居民。\n\n' },
                    { "role": "user", "content": "根据主题：如何开一家面包店，\n控制在300字以内对下列段落进行撰写，直接输出结果，不需要额外的声明：店铺选址，用 markdown 格式以分点叙述的形式输出" },
                    { "role": "AI", "content": '### 1. 地理位置\n' +
                          '\n' +
                          '* 选择地理位置时,需要考虑人流量、交通便利性和周边消费氛围等因素。\n' +
                          '\n' +
                          '### 2. 竞争情况\n' +
                          '\n' +
                          '* 需要分析周边面包店的数量和品牌,以及它们的定价和产品质量。\n' +
                          '\n' +
                          '### 3. 租金和成本\n' +
                          '\n' +
                          '* 需要考虑租金成本和设备成本,以及如何获得最大效益。\n' +
                          '\n' +
                          '### 4. 周边环境\n' +
                          '\n' +
                          '* 需要考虑周边的消费能力和消费意愿,以及与店铺的配合度。\n\n' }]
                  await chatStore.sendMessage("根据主题：" + chatStore.inputMessage +
                      "\n控制在300字以内对下列段落进行撰写，直接输出结果，不需要额外的声明：" + line[1] + '，用 markdown 格式以分点叙述的形式输出', (data: any) => {
                    if (data != "{{successEnd}}") {
                      lastMsg_.content = data;
                    } else {
                      chatStore.QA_history = []
                      // content.push(lastMsg_.content.replaceAll('### ', '$$$$$ ').replaceAll('## ', '$$$$$ ').replaceAll('# ', '$$$$$ ').replaceAll('$$$$$ ', '### ') + "\n\n");
                      content.push(lastMsg_.content + "\n\n");
                      if(i==resp.length-1){
                        chatStore.QA_history = []
                        let messageAI = {
                          messageId: nanoid(),
                          role: "user",
                          content: chatStore.inputMessage,
                          time: sendtime,
                          source: [],
                          parentMessageId: parentMessageId,
                        };
                        //如果不是重试
                        if (!isRetry) {
                          let lastIndex = messageList.history.push(messageAI);
                          lastMsg = messageList.history[lastIndex - 1];
                        }
                        messageAI = {
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
                        content = content.join("\n\n");
                        lastMsg.content = content
                        chatStore.inputMessage = "";
                        chatStore.isSending = false;
                      }
                    }
                  })
                }
              }
            }
          })
        },
      },
      {
        name: "根据提纲生成ppt",
        description: "您好，我能够根据提纲生成ppt，提纲格式如下：\n这里是ppt的题目\n1.第一个目录\n2.第二个目录\n3.第三个目录\n4.第四个目录\n5.第五个目录",
        question: "根据提纲生成ppt",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let input_message = chatStore.inputMessage
          let resp = input_message.split("\n")
          let title = resp[0]
          resp.shift()
          lastMsg.content = "预计将进行：【" + resp.length + "】论对话后，生成“" + title + "”所需内容。请耐心等待"
          //从消息数组中删除所有role为ui的消息
          messageList.history = messageList.history.filter(
              (i: any) => i.role != "ui"
          );
          //如果已经终止发送
          if (chatStore.isAbort) {
            return;
          }
          // let messageAI = {
          //   messageId: nanoid(),
          //   role: "user",
          //   content: line,
          //   time: sendtime,
          //   source: [],
          //   parentMessageId: parentMessageId,
          // };
          chatStore.QA_history = []
          let content = ['# ' + title + '\n', '### 目录\n', resp.map((i: any) => '* ' + i).join("\n")]
          for (let i in resp) {
            let lastMsg_: any;
            let line = resp[i]
            if (line == "") continue
            line = line.split(".")
            if (line.length < 2) {
              if(i==resp.length-1){
                chatStore.QA_history = []
                let messageAI = {
                  messageId: nanoid(),
                  role: "user",
                  content: chatStore.inputMessage,
                  time: sendtime,
                  source: [],
                  parentMessageId: parentMessageId,
                };
                //如果不是重试
                if (!isRetry) {
                  let lastIndex = messageList.history.push(messageAI);
                  lastMsg = messageList.history[lastIndex - 1];
                }
                messageAI = {
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
                content = content.join("\n\n");
                lastMsg.content = content
                chatStore.inputMessage = "";
                chatStore.isSending = false;
              }
              continue  // 判断非提纲内容
            }
            content.push('## ' + resp[i])   // 保存提纲
            let num = find_RomanNumerals(line[0])
            if (num <= 0 || num == 100) {
              let messageAI = {
                messageId: nanoid(),
                role: "user",
                content: line[1],
                time: sendtime,
                source: [],
                parentMessageId: parentMessageId,
              };
              //如果不是重试
              if (!isRetry) {
                let lastIndex = messageList.history.push(messageAI);
                lastMsg_ = messageList.history[lastIndex - 1];
              }
              messageAI = {
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
                lastMsg_ = messageList.history[lastIndex - 1];
              }
              chatStore.QA_history = [{ "role": "user", "content": "根据主题：如何开一家面包店，\n控制在300字以内对下列段落进行撰写，直接输出结果，不需要额外的声明：市场调研，用 markdown 格式以分点叙述的形式输出" },
                { "role": "AI", "content": '### 1. 调查目标市场\n\n' +
                      '* 在开一家面包店之前,我们需要先调查我们的目标市场。我们需要了解我们的目标客户是谁,他们的需求和喜好是什么,以及市场竞争情况等等。\n' +
                      '\n' +
                      '* 我们需要了解当地人口结构、收入水平、消费习惯、购买力以及竞争对手的面包店数量和规模等情况。同时,我们还需要了解目标市场的消费趋势,特别是在年轻人、家庭和糖尿病患者等人群中的趋势。\n' +
                      '\n' +
                      '* 通过这些调查,我们可以更好地了解市场需求,以及确定我们的目标市场。\n' +
                      '\n' +
                      '### 2. 研究竞争对手\n\n' +
                      '* 研究竞争对手是开一家面包店前必须要做的事情，\n' +
                      '\n' +
                      '### 3. 选择合适的地点\n\n' +
                      '* 选择合适的地点也是成功开设面包店的关键。应该选择人流量大、消费水平高、竞争少的地理位置\n' +
                      '* 如果开设在繁华的商业街上，可以吸引更多的顾客。如果选择开设在社区或住宅区附近，可以吸引到更多的家庭和居民。\n\n' },
                { "role": "user", "content": "根据主题：如何开一家面包店，\n控制在300字以内对下列段落进行撰写，直接输出结果，不需要额外的声明：店铺选址，用 markdown 格式以分点叙述的形式输出" },
                { "role": "AI", "content": '### 1. 地理位置\n' +
                      '\n' +
                      '* 选择地理位置时,需要考虑人流量、交通便利性和周边消费氛围等因素。\n' +
                      '\n' +
                      '### 2. 竞争情况\n' +
                      '\n' +
                      '* 需要分析周边面包店的数量和品牌,以及它们的定价和产品质量。\n' +
                      '\n' +
                      '### 3. 租金和成本\n' +
                      '\n' +
                      '* 需要考虑租金成本和设备成本,以及如何获得最大效益。\n' +
                      '\n' +
                      '### 4. 周边环境\n' +
                      '\n' +
                      '* 需要考虑周边的消费能力和消费意愿,以及与店铺的配合度。\n\n' }]
              await chatStore.sendMessage("根据主题：" + title +
                  "\n对下列段落进行详细撰写，直接输出结果，不需要额外的声明：" + line[1] + '，用 markdown 格式以分点叙述的形式输出', (data: any) => {
                if (data != "{{successEnd}}") {
                  lastMsg_.content = data;
                } else {
                  chatStore.QA_history = []
                  // content.push(lastMsg_.content.replaceAll('### ', '$$$$$ ').replaceAll('## ', '$$$$$ ').replaceAll('# ', '$$$$$ ').replaceAll('$$$$$ ', '### ') + "\n\n");
                  content.push(lastMsg_.content + "\n\n");
                  if(i==resp.length-1){
                    chatStore.QA_history = []
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
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
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                }
              })
            }
          }
        },
      },
      {
        name: "经济运行月报（知识库）",
        description: "你好，有什么我能帮助您的？您只需要输入【经济运行月报】，我就可以给您输出完整详实的报告，此报告依托于本地知识库中的内容进行生成，知识库越详实，内容越完整。目前仅支持辽宁省。",
        question: "经济运行月报（知识库）",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let date = new Date();
          let year = date.getFullYear();
          let month = date.getMonth()+1;
          let lastMsg_: any;
          chatStore.sendMessage("你将作为一个经济运行分析师，生成经济运行报告，根据以下主题，写一篇高度凝练且全面的月度经济运行报告提纲，直接输出结果，不需要额外的声明：\n" + year + "年" + month + "月" +"辽宁省经济运行报告", async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let line = year + "年" + month + "月 " + "辽宁省 经济 运行 报告"
              let response
              try {
                response = await axios
                    .post(import.meta.env.VITE_WENDA_URL + "/api/find", {
                      prompt: line,
                    })
              }catch(e){
                console.log(error);
                lastMsg_.content = "检索数据失败";
              }
              console.log(response.data);
              //从消息数组中删除所有role为ui的消息
              messageList.history = messageList.history.filter(
                  (i: any) => i.role != "ui"
              );
              //如果已经终止发送
              if (chatStore.isAbort) {
                return;
              }
              let messageAI = {
                messageId: nanoid(),
                role: "user",
                content: line,
                time: sendtime,
                source: [],
                parentMessageId: parentMessageId,
              };
              //如果不是重试
              if (!isRetry) {
                let lastIndex = messageList.history.push(messageAI);
                lastMsg_ = messageList.history[lastIndex - 1];
              }
              //如果不是重试
              if (!isRetry) {
                //给机器人添加等待效果
                messageAI = {
                  messageId: nanoid(),
                  role: "AI",
                  content: "生成内容来源于如下知识库内容",
                  time: sendtime,
                  source: response.data,
                  parentMessageId: parentMessageId,
                };
                let lastIndex = messageList.history.push(messageAI);
                lastMsg_ = messageList.history[lastIndex - 1];
              }

              //如果信息来源不为空，合并数据源并生成prompt
              chatStore.finallyPrompt = "\n根据主题：" + year + "年" + month + "月" +"辽宁省经济运行报告。\n学习以下文段, 用中文回答用户问题，如果无法从中得到答案，忽略文段内容并用中文回答用户问题。直接输出结果，不需要额外的声明：\n" +
                  response.data.map((i: any) => i.content).join(chatStore.inputMessage + "\n");


              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n")]
              for (let i in resp) {
                // let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
                  if(i==resp.length-1){
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
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
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                  continue  // 判断非提纲内容
                }
                content.push(resp[i])   // 保存提纲
                let num = find_RomanNumerals(line[0])
                if (num <= 0 || num == 100) {
                  messageAI = {
                    messageId: nanoid(),
                    role: "user",
                    content: line[1],
                    time: sendtime,
                    source: [],
                    parentMessageId: parentMessageId,
                  };
                  //如果不是重试
                  if (!isRetry) {
                    let lastIndex = messageList.history.push(messageAI);
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  messageAI = {
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
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  await chatStore.sendMessage(chatStore.finallyPrompt +
                      "\n对下列段落进行详细的撰写，如果无法从学习的文段得到答案，忽略文段内容并用中文回答用户问题，直接输出结果，不需要额外的声明：" + line[1], async (data: any) => {
                    if (data != "{{successEnd}}") {
                      lastMsg_.content = data;
                    } else {
                      content.push(lastMsg_.content + "\n\n");
                      if(i==resp.length-1){
                        let messageAI = {
                          messageId: nanoid(),
                          role: "user",
                          content: chatStore.inputMessage,
                          time: sendtime,
                          source: [],
                          parentMessageId: parentMessageId,
                        };
                        //如果不是重试
                        if (!isRetry) {
                          let lastIndex = messageList.history.push(messageAI);
                          lastMsg = messageList.history[lastIndex - 1];
                        }
                        messageAI = {
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
                        content = content.join("\n\n");
                        lastMsg.content = content
                        chatStore.inputMessage = "";
                        chatStore.isSending = false;
                      }
                    }
                  })
                }
              }
            }
          })
        },
      },
      {
        name: "模板化经济运行月报（知识库）",
        description: "您好，我能够根据提纲生成辽宁省经济运行月报，提纲格式如下：\n1.第一个目录\n2.第二个目录\n3.第三个目录\n4.第四个目录\n5.第五个目录\n此月报依托于本地知识库中的内容进行生成，知识库越详实，内容越完整。",
        question: "模板化经济运行月报（知识库）",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let date = new Date();
          let year = date.getFullYear();
          let month = date.getMonth()+1;
          let lastMsg_: any;
          let input_message = chatStore.inputMessage
          let resp = input_message.split("\n")
          let title = resp[0]
          let line = year + "年" + month + "月 " + "辽宁省 经济 运行 报告 " + title
          lastMsg.content = "预计将进行：【" + resp.length + "】论对话后，生成“" + title + "”内容。请耐心等待"
          let response
          //从消息数组中删除所有role为ui的消息
          messageList.history = messageList.history.filter(
              (i: any) => i.role != "ui"
          );
          //如果已经终止发送
          if (chatStore.isAbort) {
            return;
          }
          let messageAI = {
            messageId: nanoid(),
            role: "user",
            content: line,
            time: sendtime,
            source: [],
            parentMessageId: parentMessageId,
          };
          //如果不是重试
          // if (!isRetry) {
          //   let lastIndex = messageList.history.push(messageAI);
          //   lastMsg_ = messageList.history[lastIndex - 1];
          // }
          //如果不是重试
          // if (!isRetry) {
          //   //给机器人添加等待效果
          //   messageAI = {
          //     messageId: nanoid(),
          //     role: "AI",
          //     content: "生成内容来源于如下知识库内容",
          //     time: sendtime,
          //     source: response.data,
          //     parentMessageId: parentMessageId,
          //   };
          //   let lastIndex = messageList.history.push(messageAI);
          //   lastMsg_ = messageList.history[lastIndex - 1];
          // }

          let content = [resp.join("\n\n")]

          for (let i=1; i<resp.length; i++) {
            // let lastMsg_: any;
            let line = resp[i]
            let promptcontent = year + "年" + month + "月 " + "辽宁省 经济 运行 报告 " + title + line
            if (line == "") continue
            line = line.split(".")
            if (line.length < 2) {
              if(i==resp.length-1){
                let messageAI = {
                  messageId: nanoid(),
                  role: "user",
                  content: chatStore.inputMessage,
                  time: sendtime,
                  source: [],
                  parentMessageId: parentMessageId,
                };
                //如果不是重试
                if (!isRetry) {
                  let lastIndex = messageList.history.push(messageAI);
                  lastMsg = messageList.history[lastIndex - 1];
                }
                messageAI = {
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
                content = content.join("\n\n");
                lastMsg.content = content
                chatStore.inputMessage = "";
                chatStore.isSending = false;
              }
              continue  // 判断非提纲内容
            }
            try {
              response = await axios
                  .post(import.meta.env.VITE_WENDA_URL + "/api/find", {
                    prompt: promptcontent,
                  })
            }catch(e){
              lastMsg_.content = "检索数据失败";
              if (!isRetry) {
                //给机器人添加等待效果
                messageAI = {
                  messageId: nanoid(),
                  role: "AI",
                  content: lastMsg_.content,
                  time: sendtime,
                  source: response.data,
                  parentMessageId: parentMessageId,
                };
                let lastIndex = messageList.history.push(messageAI);
                lastMsg_ = messageList.history[lastIndex - 1];
              }
              return;
            }
            //如果信息来源不为空，合并数据源并生成prompt
            chatStore.finallyPrompt = "\n根据主题：" + title + "，\n并学习以下文段：\n" +
                response.data.map((i: any) => i.content).join("\n");
            content.push(resp[i])   // 保存提纲
            let num = find_RomanNumerals(line[0])
            if (num <= 0 || num == 100) {
              messageAI = {
                messageId: nanoid(),
                role: "user",
                content: line[1],
                time: sendtime,
                source: [],
                parentMessageId: parentMessageId,
              };
              //如果不是重试
              if (!isRetry) {
                let lastIndex = messageList.history.push(messageAI);
                lastMsg_ = messageList.history[lastIndex - 1];
              }
              messageAI = {
                messageId: nanoid(),
                role: "AI",
                content: "等待模型中...",
                time: sendtime,
                source: response.data,
                parentMessageId: parentMessageId,
              };
              //如果不是重试
              if (!isRetry) {
                let lastIndex = messageList.history.push(messageAI);
                lastMsg_ = messageList.history[lastIndex - 1];
              }
              await chatStore.sendMessage(chatStore.finallyPrompt +
                  "\n对下列段落进行详细的撰写，如果无法从学习的文段得到答案，忽略文段内容并用中文回答用户问题，直接输出结果，不需要额外的声明：" + line[1], async (data: any) => {
                if (data != "{{successEnd}}") {
                  lastMsg_.content = data;
                } else {
                  content.push(lastMsg_.content + "\n\n");
                  if(i==resp.length-1){
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
                      messageId: nanoid(),
                      role: "AI",
                      content: "等待模型中...",
                      time: sendtime,
                      source: response.data,
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                }
              })
            }
          }
        },
      },
      {
        name: "日常工作总结",
        description: "您好，我能够根据主题撰写内容翔实、有信服力的工作总结，只需要输入工作名称即可，此输出完全依托于模型进行生成。",
        question: "你将作为一个部门经理，汇报工作总结",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.sendMessage("你将作为一个部门经理，进行工作总结，越详尽越好，根据以下内容，写一篇高度凝练且全面的部门工作提纲，直接输出结果，不需要额外的声明：" + chatStore.inputMessage,  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n")]
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
                  if(i==resp.length-1){
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
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
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                  continue  // 判断非提纲内容
                }
                content.push(resp[i])   // 保存提纲
                let num = find_RomanNumerals(line[0])
                if (num <= 0 || num == 100) {
                  let messageAI = {
                    messageId: nanoid(),
                    role: "user",
                    content: line[1],
                    time: sendtime,
                    source: [],
                    parentMessageId: parentMessageId,
                  };
                  //如果不是重试
                  if (!isRetry) {
                    let lastIndex = messageList.history.push(messageAI);
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  messageAI = {
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
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  await chatStore.sendMessage("根据主题：" + chatStore.inputMessage +
                      "\n对下列段落进行详细的撰写，直接输出结果，不需要额外的声明：" + line[1], (data: any) => {
                    if (data != "{{successEnd}}") {
                      lastMsg_.content = data;
                    } else {
                      content.push(lastMsg_.content + "\n\n");
                      if(i==resp.length-1){
                        let messageAI = {
                          messageId: nanoid(),
                          role: "user",
                          content: chatStore.inputMessage,
                          time: sendtime,
                          source: [],
                          parentMessageId: parentMessageId,
                        };
                        //如果不是重试
                        if (!isRetry) {
                          let lastIndex = messageList.history.push(messageAI);
                          lastMsg = messageList.history[lastIndex - 1];
                        }
                        messageAI = {
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
                        content = content.join("\n\n");
                        lastMsg.content = content
                        chatStore.inputMessage = "";
                        chatStore.isSending = false;
                      }
                    }
                  })
                }
              }
            }
          })
        },
      },
      {
        name: "思维导图",
        description: "您好，我能够根据主题帮我出一个思维导图，您只需要输入主题名称即可，此输出完全依托于模型进行生成。",
        question: "根据主题帮我出一个思维导图",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let modlename = import.meta.env.VITE_WENDA_MODLE_NAME;
          let firstcontent = ''
          if(modlename == 'glm6b'){
            chatStore.QA_history = [{ "role": "user", "content": "我的问题是：“如何开一家面包店”。你知道什么是markdown的源代码吧？是的话，你不用帮我生成思维导图，你只需要根据我的问题，生成一份关于我问题主题大纲的markdown源代码，我会用你的markdown代码来生成思维导图。在markdown格式中，# 表示中央主题， ## 表示主要主题，### 表示子主题，- 表示叶子节点。你不需要用代码块（```）将markdown括起来，直接输出结果，不需要额外的声明。请参照以上格式进行回复。" },
              { "role": "AI", "content": '```shell\n# 如何开好一家面包店\n\n## 食材和设备\n\n## 1. 市场调研\n\n- 确定目标市场\n' +
                    '- 了解目标市场的需求和趋势\n' +
                    '- 确定店铺的定位和风格\n\n## 2. 店铺选址\n\n- 选择适合店铺的地点\n' +
                    '- 考虑人流量、交通和商业配套等因素\n' +
                    '- 评估租金、装修和设备成本\n\n## 3. 品牌设计和包装\n\n' },{ "role": "user", "content": "我的问题是：“如何开发一个软件”。你知道什么是markdown的源代码吧？是的话，你不用帮我生成思维导图，你只需要根据我的问题，生成一份关于我问题主题大纲的markdown源代码，我会用你的markdown代码来生成思维导图。在markdown格式中，# 表示中央主题， ## 表示主要主题，### 表示子主题，- 表示叶子节点。你不需要用代码块（```）将markdown括起来，直接输出结果，不需要额外的声明。请参照以上格式进行回复。" },
              { "role": "AI", "content": '```shell\n# 如何开发一个软件\n\n## 1. 确定软件的目标和功能\n\n- 2. 收集用户需求\n' +
                    '- 3. 设计软件架构\n' +
                    '- 4. 编写代码和测试\n\n## 2. 收集用户需求\n\n## 3. 设计软件架构\n\n## 4. 编写代码和测试\n\n### 5. 部署和发布\n\n- 服务器\n\n- 操作系统\n\n## 6. 持续迭代和升级\n\n' }]

            firstcontent = "我的问题是：“" + chatStore.inputMessage + "”。你知道什么是markdown的源代码吧？是的话，你不用帮我生成思维导图，你只需要根据我的问题，生成一份关于我问题主题大纲的markdown源代码，我会用你的markdown代码来生成思维导图。在markdown格式中，# 表示中央主题， ## 表示主要主题，### 表示子主题，- 表示叶子节点。你不需要用代码块（```）将markdown括起来，直接输出结果，不需要额外的声明。请参照以上格式进行回复。"
          }else{
            chatStore.QA_history = [{ "role": "user", "content": "根据所给的内容：如何开一家面包店，生成一份详尽的大纲，用 markdown 格式以分点叙述的形式输出" },
              { "role": "AI", "content": '```shell\n# 如何开好一家面包店\n\n## 食材和设备\n\n## 1. 市场调研\n\n- 确定目标市场\n' +
                    '- 了解目标市场的需求和趋势\n' +
                    '- 确定店铺的定位和风格\n\n## 2. 店铺选址\n\n- 选择适合店铺的地点\n' +
                    '- 考虑人流量、交通和商业配套等因素\n' +
                    '- 评估租金、装修和设备成本\n\n## 3. 品牌设计和包装\n\n' },{ "role": "user", "content": "根据所给的内容：如何开发一个软件，生成一份详尽的大纲，用 markdown 格式以分点叙述的形式输出。" },
              { "role": "AI", "content": '```shell\n# 如何开发一个软件\n\n## 1. 确定软件的目标和功能\n\n- 2. 收集用户需求\n' +
                    '- 3. 设计软件架构\n' +
                    '- 4. 编写代码和测试\n\n## 2. 收集用户需求\n\n## 3. 设计软件架构\n\n## 4. 编写代码和测试\n\n### 5. 部署和发布\n\n- 服务器\n\n- 操作系统\n\n## 6. 持续迭代和升级\n\n' }]

            firstcontent = "根据所给的内容:" + chatStore.inputMessage + "，生成一份详尽的大纲，用 markdown 格式以分点叙述的形式输出。"
          }
          chatStore.sendMessage(firstcontent,  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = [];
              chatStore.inputMessage = "";
              chatStore.isSending = false;
            }
          })
        },
      },
      {
        name: "产业链图谱",
        description: "您好，我能够根据产品名称，寻找该产品的上下游产业信息，并以图谱的形式展示出来。",
        question: "根据主题帮我出一个产业链图谱",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let modlename = import.meta.env.VITE_WENDA_MODLE_NAME;
          let firstcontent = ''
          if(modlename == 'glm6b'){
            chatStore.QA_history = [{ "role": "user", "content": "我的问题是：“发动机”。你知道什么是markdown的源代码吧？是的话，你不用帮我生成思维导图，你只需要根据我的问题，生成一份产业链上下游相关产品或原料的markdown源代码，我会用你的markdown代码来生成思维导图。在markdown格式中，# 表示中央主题， ## 表示主要主题，### 表示子主题，- 表示叶子节点。你不需要用代码块（```）将markdown括起来，直接输出结果，不需要额外的声明。请参照以上格式进行回复。" },
              { "role": "AI", "content": '```shell\n# 发动机\n\n## 上游\n\n- 钢铁\n' +
                    '- 铝合金\n' +
                    '- 螺丝\n\n## 下游\n\n- 销售公司\n' +
                    '- 汽车制造\n' +
                    '- 4s店\n\n' },{ "role": "user", "content": "我的问题是：“风机”。你知道什么是markdown的源代码吧？是的话，你不用帮我生成思维导图，你只需要根据我的问题，生成一份产业链上下游相关产品或原料的markdown源代码，我会用你的markdown代码来生成思维导图。在markdown格式中，# 表示中央主题， ## 表示主要主题，### 表示子主题，- 表示叶子节点。你不需要用代码块（```）将markdown括起来，直接输出结果，不需要额外的声明。请参照以上格式进行回复。" },
              { "role": "AI", "content": '```shell\n# 风机\n\n## 上游\n\n- 扇叶\n' +
                    '- 曲轮\n' +
                    '- 涂层\n\n## 下游\n\n- 路政\n\n### 新能源\n\n- 华电\n\n- 华能\n\n' }]

            firstcontent = "我的问题是：“" + chatStore.inputMessage + "”。你知道什么是markdown的源代码吧？是的话，你不用帮我生成思维导图，你只需要根据我的问题，生成一份产业链上下游相关产品或原料的markdown源代码，我会用你的markdown代码来生成思维导图。在markdown格式中，# 表示中央主题， ## 表示主要主题，### 表示子主题，- 表示叶子节点。你不需要用代码块（```）将markdown括起来，直接输出结果，不需要额外的声明。请参照以上格式进行回复。"
          }else{
            chatStore.QA_history = [{ "role": "user", "content": "根据所给的内容：如何开一家面包店，生成一份详尽的大纲，用 markdown 格式以分点叙述的形式输出" },
              { "role": "AI", "content": '```shell\n# 如何开好一家面包店\n\n## 食材和设备\n\n## 1. 市场调研\n\n- 确定目标市场\n' +
                    '- 了解目标市场的需求和趋势\n' +
                    '- 确定店铺的定位和风格\n\n## 2. 店铺选址\n\n- 选择适合店铺的地点\n' +
                    '- 考虑人流量、交通和商业配套等因素\n' +
                    '- 评估租金、装修和设备成本\n\n## 3. 品牌设计和包装\n\n' },{ "role": "user", "content": "根据所给的内容：如何开发一个软件，生成一份详尽的大纲，用 markdown 格式以分点叙述的形式输出。" },
              { "role": "AI", "content": '```shell\n# 如何开发一个软件\n\n## 1. 确定软件的目标和功能\n\n- 2. 收集用户需求\n' +
                    '- 3. 设计软件架构\n' +
                    '- 4. 编写代码和测试\n\n## 2. 收集用户需求\n\n## 3. 设计软件架构\n\n## 4. 编写代码和测试\n\n### 5. 部署和发布\n\n- 服务器\n\n- 操作系统\n\n## 6. 持续迭代和升级\n\n' }]

            firstcontent = "根据所给的内容:" + chatStore.inputMessage + "，生成一份详尽的大纲，用 markdown 格式以分点叙述的形式输出。"
          }
          chatStore.sendMessage(firstcontent,  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = [];
              chatStore.inputMessage = "";
              chatStore.isSending = false;
            }
          })
        },
      },
      /*{
        name: "表生成图",
        description: "您好，我能够根据表格数据生成合适的图形。",
        question: "根据主题帮我出一个echart图",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let modlename = import.meta.env.VITE_WENDA_MODLE_NAME;
          let firstcontent = ''
          chatStore.QA_history = [{ "role": "user", "content": "根据下面的数据，生成一个[```echarts和```]包裹的Markdown格式的数据，请给我出一个echarts柱图的option：\n| 年份 | 辽宁与北京的合作合同金额(亿元) | 辽宁与上海的合作合同金额(亿元) | 辽宁与深圳的合作合同金额(亿元) |\n" +
                "| --- | --- | --- | --- |\n" +
                "| 2017 | 539.7 | 487.8 | 563.4 |\n" +
                "| 2018 | 557.6 | 499.9 | 579.2 |\n" +
                "| 2019 | 576.9 | 512.4 | 599.9 |\n" +
                "| 2020 | 619.2 | 547.1 | 632.4 |" },
            { "role": "AI", "content": "```echarts\n" +
                  "{\n" +
                  "    \"width\": 500,\n" +
                  "    \"height\": 400,\n" +
                  "     \"xAxis\": {\n" +
                  "      \"type\": \"category\",\n" +
                  "      \"data\": [\"辽宁\", \"北京\", \"上海\", \"深圳\"]\n" +
                  "    },\n" +
                  "    \"yAxis\": {\n" +
                  "      \"type\": \"value\"\n" +
                  "    },\n" +
                  "    \"series\": [\n" +
                  "      {\n" +
                  "        \"name\": \"辽宁\",\n" +
                  "        \"type\": \"bar\",\n" +
                  "        \"data\": [539.7, 487.8, 563.4]\n" +
                  "      },\n" +
                  "      {\n" +
                  "        \"name\": \"北京\",\n" +
                  "        \"type\": \"bar\",\n" +
                  "        \"data\": [557.6, 499.9, 579.2]\n" +
                  "      },\n" +
                  "      {\n" +
                  "        \"name\": \"上海\",\n" +
                  "        \"type\": \"bar\",\n" +
                  "        \"data\": [576.9, 512.4, 599.9]\n" +
                  "      },\n" +
                  "      {\n" +
                  "        \"name\": \"深圳\",\n" +
                  "        \"type\": \"bar\",\n" +
                  "        \"data\": [619.2, 547.1, 632.4]\n" +
                  "      }\n" +
                  "    ]\n" +
                  "}\n```" },{ "role": "user", "content": "根据下面的数据，生成一个[```echarts和```]包裹的Markdown格式的数据，请给我出一个echarts饼图的option：\n| 网站 | 分享 | 朋友 | 广告 |\n" +
                  "| --- | --- | --- | --- |\n" +
                  "| 1048 | 735 | 580 | 484 |" },
            { "role": "AI", "content": "```echarts\n" +
                  "{\n" +
                  "  \"series\": [\n" +
                  "    {\n" +
                  "      \"name\": \"Access From\",\n" +
                  "      \"type\": \"pie\",\n" +
                  "      \"radius\": \"50%\",\n" +
                  "      \"data\": [\n" +
                  "        { \"value\": 1048, \"name\": \"Search Engine\" },\n" +
                  "        { \"value\": 735, \"name\": \"Direct\" },\n" +
                  "        { \"value\": 580, \"name\": \"Email\" },\n" +
                  "        { \"value\": 484, \"name\": \"Union Ads\" },\n" +
                  "        { \"value\": 300, \"name\": \"Video Ads\" }\n" +
                  "      ]\n" +
                  "    }\n" +
                  "  ]\n" +
                  "}\n```" }]

          firstcontent = "根据下面的数据，生成一个[```echarts和```]包裹的Markdown格式的数据，" + chatStore.inputMessage
          chatStore.sendMessage(firstcontent,  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = [];
              chatStore.inputMessage = "";
              chatStore.isSending = false;
            }
          })
        },
      },*/
      {
        name: "材料改写",
        description: "您好，我可以对指定内容进行改写，您只需要输入要改写的内容即可。",
        question: "用中文改写以下段落，可以提到相同或类似的内容,但不必重复使用。可以使用一些修辞手法来增强文本的美感,例如比喻、拟人、排比等。可以添加更多的细节来丰富文本的内容和形象,例如描述人物、场景、事件等。可以通过逻辑推导来得出结论或观点,例如通过推理、分析、比较等方式。可以无中生有地提到一些内容,以增加细节和丰富性,例如通过虚构、猜测等方式。在修改段落时,需要确保文本的含义不发生变化,可以重新排列句子、改变表达方式。",
        fun_: "不是方法",
      },
      {
        name: "翻译",
        description: "您好，我可以将您输入的外语内容翻译成中文。",
        question: "翻译成中文：",
        fun_: "不是方法",
      },
      {
        name: "语音输入优化",
        description: "处理用第三方应用语音转换的文字，精简口头禅和语气词。",
        question: "请用简洁明了的语言，编辑以下段落，以改善其逻辑流程，消除印刷错误，并以中文作答。请务必保持文章的原意。请从编辑以下文字开始：",
        fun_: "不是方法",
      },
      {
        name: "摘要生成",
        description: "您好，我可以根据您输入的内容，提取要点并适当扩充，输出摘要内容。",
        question: "使用下面提供的文本作为基础，生成一个简洁的中文摘要，突出最重要的内容，并提供对决策有用的分析。",
        fun_: "不是方法",
      },
      {
        name: "问题生成",
        description: "您好，我可以基于内容生成常见问答，一般会输出10个左右的问题",
        question: "根据以下内容，生成一个 10 个常见问题的清单：",
        fun_: "不是方法",
      },
      {
        name: "提问助手",
        description: "您好，我可以根据您输入的内容，多角度提问，触发深度思考。",
        question: "针对以下内容，提出疑虑和可能出现的问题，用来促进更完整的思考：",
        fun_: "不是方法",
      },
      {
        name: "评论助手",
        description: "您好，我可以根据您输入的内容，输出一段最中肯的评论。",
        question: "针对以下内容，进行一段有评论，可以包括对作者的感谢，提出可能出现的问题等：",
        fun_: "不是方法",
      },
      {
        name: "意见回答",
        description: "为意见答复提供模板",
        question: "你是一个回复基层意见的助手，你会针对一段内容拟制回复，回复中应充分分析可能造成的后果，并从促进的单位建设的角度回答。回应以下内容：",
        fun_: "不是方法",
      },
      {
        name: "写提纲",
        description: "您好，我可以根据您提供的主题生成一份提纲。",
        question: "你是一个擅长思考的助手，你会把一个主题拆解成相关的多个子主题。请你使用中文，针对下列主题，提供相关的子主题。直接输出结果，不需要额外的声明：",
        fun_: "不是方法",
      },
      {
        name: "内容总结",
        description: "您好，我可以根据您是呼入的内容，输出一份 100 字以内的内容总结。",
        question: "将以下文字概括为 100 个字，使其易于阅读和理解。避免使用复杂的句子结构或技术术语。",
        fun_: "不是方法",
      },
      {
        name: "写新闻",
        description: "您好，我可以根据主题撰写新闻。",
        question: "使用清晰、简洁、易读的语言写一篇新闻，主题为",
        fun_: "不是方法",
      },
      {
        name: "根据标题写论文",
        description: "您好，我可以根据主题撰写内容翔实、有信服力的论文，此输出完全依托于模型进行生成。",
        question: "根据主题撰写内容翔实、有信服力的论文",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.sendMessage("根据以下主题，写一篇高度凝练且全面的论文提纲：" + chatStore.inputMessage, async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n")]
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
                  if(i==resp.length-1){
                    let messageAI = {
                      messageId: nanoid(),
                      role: "user",
                      content: chatStore.inputMessage,
                      time: sendtime,
                      source: [],
                      parentMessageId: parentMessageId,
                    };
                    //如果不是重试
                    if (!isRetry) {
                      let lastIndex = messageList.history.push(messageAI);
                      lastMsg = messageList.history[lastIndex - 1];
                    }
                    messageAI = {
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
                    content = content.join("\n\n");
                    lastMsg.content = content
                    chatStore.inputMessage = "";
                    chatStore.isSending = false;
                  }
                  continue  // 判断非提纲内容
                }
                content.push(resp[i])   // 保存提纲
                let num = find_RomanNumerals(line[0])
                if (num <= 0 || num == 100) {
                  let messageAI = {
                    messageId: nanoid(),
                    role: "user",
                    content: line[1],
                    time: sendtime,
                    source: [],
                    parentMessageId: parentMessageId,
                  };
                  //如果不是重试
                  if (!isRetry) {
                    let lastIndex = messageList.history.push(messageAI);
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  messageAI = {
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
                    lastMsg_ = messageList.history[lastIndex - 1];
                  }
                  await chatStore.sendMessage("根据主题：" + chatStore.inputMessage +
                      "\n对下列段落进行详细的撰写：" + line[1], (data: any) => {
                    if (data != "{{successEnd}}") {
                      lastMsg_.content = data;
                    } else {
                      content.push(lastMsg_.content + "\n\n");
                      if(i==resp.length-1){
                        let messageAI = {
                          messageId: nanoid(),
                          role: "user",
                          content: chatStore.inputMessage,
                          time: sendtime,
                          source: [],
                          parentMessageId: parentMessageId,
                        };
                        //如果不是重试
                        if (!isRetry) {
                          let lastIndex = messageList.history.push(messageAI);
                          lastMsg = messageList.history[lastIndex - 1];
                        }
                        messageAI = {
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
                        content = content.join("\n\n");
                        lastMsg.content = content
                        chatStore.inputMessage = "";
                        chatStore.isSending = false;
                      }
                    }
                  })
                }
              }
            }
          })
        },
      },
      {
        name: "知识库增强(根据关键词)",
        description: "您好，我可以根据您输入的内容进行关键字提取，并进行详细的多轮知识库学习，最终根据多轮输出内容进行最终的回答。",
        question: "知识库增强(根据关键词)",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.QA_history = [{ "role": "user", "content": "现在开始,你的任务是提取关键词，提取下列语句中的关键词，并用空格分隔：科普之路是不是任重而道远？" },
            { "role": "AI", "content": '科普 道路 任重 道远' },{ "role": "user", "content": "现在开始,你的任务是提取关键词，提取下列语句中的关键词，并用空格分隔：苏州高新区和上海高新区在人才政策上的区别是什么？" },
            { "role": "AI", "content": '苏州高新区 上海高新区 人才政策' }]
          chatStore.sendMessage("现在开始,你的任务是提取关键词，提取下列语句中的关键词，并用空格分隔：" + chatStore.inputMessage, async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              chatStore.QA_history = []
              let resp = lastMsg.content.replace(/关键词提取/g, '').replace(/[：，]/g, ' ').trim().split(' ')
              let content = []
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                await axios
                    .post(import.meta.env.VITE_WENDA_URL + "/api/find", {
                      prompt: line,
                    })
                    .then(async function (response) {
                      console.log(response.data);
                      //从消息数组中删除所有role为ui的消息
                      messageList.history = messageList.history.filter(
                          (i: any) => i.role != "ui"
                      );
                      //如果已经终止发送
                      if (chatStore.isAbort) {
                        return;
                      }
                      let messageAI = {
                        messageId: nanoid(),
                        role: "user",
                        content: line,
                        time: sendtime,
                        source: [],
                        parentMessageId: parentMessageId,
                      };
                      //如果不是重试
                      if (!isRetry) {
                        let lastIndex = messageList.history.push(messageAI);
                        lastMsg_ = messageList.history[lastIndex - 1];
                      }
                      //如果不是重试
                      if (!isRetry) {
                        //给机器人添加等待效果
                        messageAI = {
                          messageId: nanoid(),
                          role: "AI",
                          content: "等待模型中...",
                          time: sendtime,
                          source: response.data,
                          parentMessageId: parentMessageId,
                        };
                        let lastIndex = messageList.history.push(messageAI);
                        lastMsg_ = messageList.history[lastIndex - 1];
                      }

                      //如果信息来源不为空，合并数据源并生成prompt
                      chatStore.finallyPrompt = "学习以下文段, 用中文回答用户问题。如果无法从中得到答案，忽略文段内容并用中文回答用户问题。\n" +
                          response.data.map((i: any) => i.content).join("\n") + "\n问题：" + chatStore.inputMessage

                      await chatStore.sendMessage(chatStore.finallyPrompt, async (data: any) => {
                        if (data != "{{successEnd}}") {
                          lastMsg_.content = data;
                        } else {
                          console.log(content)
                          content.push(lastMsg_.content + "\n\n");
                          console.log('content===========',content)
                          if(i==resp.length-1){
                            chatStore.finallyPrompt = "学习以下文段, 用中文回答用户问题。如果无法从中得到答案，忽略文段内容并用中文回答用户问题。\n" +
                                content.join('\n') + "\n问题：" + chatStore.inputMessage
                            messageAI = {
                              messageId: nanoid(),
                              role: "user",
                              content: chatStore.inputMessage,
                              time: sendtime,
                              source: [],
                              parentMessageId: parentMessageId,
                            };
                            //如果不是重试
                            if (!isRetry) {
                              let lastIndex = messageList.history.push(messageAI);
                              lastMsg_ = messageList.history[lastIndex - 1];
                            }
                            messageAI = {
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
                              lastMsg_ = messageList.history[lastIndex - 1];
                            }
                            await chatStore.sendMessage(chatStore.finallyPrompt, (data: any) => {
                              if (data != "{{successEnd}}") {
                                lastMsg_.content = data;
                              } else {
                                chatStore.inputMessage = "";
                                chatStore.isSending = false;
                              }
                            })
                          }
                        }
                      });
                    })
                    .catch(function (error) {
                      console.log(error);
                      lastMsg_.content = "检索数据失败";
                    });
              }
            }
          })
        },
      },
    ],
  }),
  getters: {},
  actions: {
    //删除消息
    deleteMessage(messageId: string) {
      let messageList = this.messageList;
      let index = messageList.findIndex((item) => item.messageId === messageId);
      messageList.splice(index, 1);
    },
  },
});
