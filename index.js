import {tool} from "@langchain/core/tools"
import { ChatOpenAI } from "@langchain/openai"
import {z} from "zod"
import dotenv from "dotenv"

import { tavily } from "@tavily/core";

dotenv.config();

const client =  tavily({apiKey : process.env.TAVILYAPIKEY})


const llm = new ChatOpenAI({
  apiKey : process.env.OPENAIKEY,
  model : "gpt-4o"
})

const search = tool(
  async( {query} ) => {
    const result = await client.search(query , {maxResult : 5})
    return result
  }, 
  {
    name : "websearch", 
    description : "searches the web for up-to-date information",
    schema : z.object({
      query : z.string()
    })

  }
)

const add = tool(
  async( {a , b} ) => {
    return a + b
  }, 
  {
    name : "add", 
    description : "adding this two numbers",
    schema : z.object({
      a : z.number(),
      b : z.number()
    })

  }
)

const llmWithSearch = llm.bindTools([search])


const llmWithTools = llm.bindTools([add])
const message = await llmWithTools.invoke("What is the sum of 242 and 23?");
const searchMessage = await llmWithSearch.invoke("what is the name of indian prime minister?")
console.log("searchMessage" , searchMessage)



if(message?.tool_calls.length){
  for(const call of message.tool_calls){
    if(call.name === "add"){
      const result = await add.invoke(call.args)
      console.log("Tools result" , result)

      const finalAnswer = await llmWithTools.invoke([
        message ,  {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result)
        }
      ])

      console.log("finalAns" , finalAnswer)
    }
  }
}

if (searchMessage?.tool_calls?.length) {
  for (const call of searchMessage.tool_calls) {
    if (call.name === "websearch") {
      const result = await search.invoke(call.args);

      const finalSearchAnswer = await llmWithSearch.invoke([
        searchMessage,
        {
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result)
        }
      ]);

      console.log("Final Search Answer:", finalSearchAnswer);
    }
  }
}

