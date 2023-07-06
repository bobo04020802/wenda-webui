import {defineStore, storeToRefs} from "pinia";
import {nanoid} from "nanoid";
import axios from "axios";
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
        description: "知识库|内部模型",
        question: "知识库|内部模型",
        fun_: "不是方法",
      },
      {
        name: "内容到excel",
        description: "内容到excel",
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
        name: "产业规划",
        description: "根据主题撰写内容翔实、有信服力的产业规划报告",
        question: "你将作为一个产品经理，进行产业链分析，并绘制产业链结构表",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.sendMessage("你将作为一个产品经理，进行产业规划，重点分析产业链，越详尽越好，根据以下主题，写一篇高度凝练且全面的产业报告提纲：" + chatStore.inputMessage,  async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n"), "------------------------------正文------------------------------"]
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
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
        name: "经济运行月报（知识库）",
        description: "经济运行月报（知识库）",
        question: "经济运行月报（知识库）",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          let date = new Date();
          let year = date.getFullYear();
          let month = date.getMonth()+1;
          let lastMsg_: any;
          chatStore.sendMessage("你将作为一个经济运行分析角色，出具一套经济运行报告，根据以下主题，写一篇高度凝练且全面的经济运行报告提纲：" + year + "年" + month + "月" +"经济运行报告", async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let line = year + "年" + month + "月 " + "经济 运行 报告"
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
              chatStore.finallyPrompt = "\n根据主题：" + year + "年" + month + "月" +"经济运行报告。\n学习以下文段, 用中文回答用户问题。\n" +
                  response.data.map((i: any) => i.content).join(chatStore.inputMessage + "\n");


              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n"), "------------------------------正文------------------------------"]
              for (let i in resp) {
                console.log("resp========",resp)
                // let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
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
                      "\n对下列段落进行详细的撰写，如果无法从学习的文段得到答案，忽略文段内容并用中文回答用户问题：" + line[1], async (data: any) => {
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
        name: "材料改写",
        description: "对指定内容进行多个版本的改写，以避免文本重复",
        question: "用中文改写以下段落，可以提到相同或类似的内容,但不必重复使用。可以使用一些修辞手法来增强文本的美感,例如比喻、拟人、排比等。可以添加更多的细节来丰富文本的内容和形象,例如描述人物、场景、事件等。可以通过逻辑推导来得出结论或观点,例如通过推理、分析、比较等方式。可以无中生有地提到一些内容,以增加细节和丰富性,例如通过虚构、猜测等方式。在修改段落时,需要确保文本的含义不发生变化,可以重新排列句子、改变表达方式。",
        fun_: "不是方法",
      },
      {
        name: "翻译",
        description: "",
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
        description: "根据内容，提取要点并适当扩充",
        question: "使用下面提供的文本作为基础，生成一个简洁的中文摘要，突出最重要的内容，并提供对决策有用的分析。",
        fun_: "不是方法",
      },
      {
        name: "问题生成",
        description: "基于内容生成常见问答",
        question: "根据以下内容，生成一个 10 个常见问题的清单：",
        fun_: "不是方法",
      },
      {
        name: "提问助手",
        description: "多角度提问，触发深度思考",
        question: "针对以下内容，提出疑虑和可能出现的问题，用来促进更完整的思考：",
        fun_: "不是方法",
      },
      {
        name: "评论助手",
        description: "",
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
        description: "",
        question: "你是一个擅长思考的助手，你会把一个主题拆解成相关的多个子主题。请你使用中文，针对下列主题，提供相关的子主题。直接输出结果，不需要额外的声明：",
        fun_: "不是方法",
      },
      {
        name: "内容总结",
        description: "将文本内容总结为 100 字。",
        question: "将以下文字概括为 100 个字，使其易于阅读和理解。避免使用复杂的句子结构或技术术语。",
        fun_: "不是方法",
      },
      {
        name: "写新闻",
        description: "根据主题撰写新闻",
        question: "使用清晰、简洁、易读的语言写一篇新闻，主题为",
        fun_: "不是方法",
      },
      {
        name: "根据标题写论文",
        description: "根据主题撰写内容翔实、有信服力的论文",
        question: "根据主题撰写内容翔实、有信服力的论文",
        fun_: async (chatStore,lastMsg,find_RomanNumerals,sendtime,parentMessageId,messageList,isRetry) => {
          chatStore.sendMessage("根据以下主题，写一篇高度凝练且全面的论文提纲：" + chatStore.inputMessage, async (data: any) => {
            if (data != "{{successEnd}}") {
              lastMsg.content = data;
            } else {
              let resp = lastMsg.content.replace(/\n- /g, '\n1.')//兼容不同格式
                  .split("\n");
              let content = [resp.join("\n\n"), "------------------------------正文------------------------------"]
              for (let i in resp) {
                let lastMsg_: any;
                let line = resp[i]
                if (line == "") continue
                line = line.split(".")
                if (line.length < 2) {
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
        description: "知识库增强(根据关键词)",
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
