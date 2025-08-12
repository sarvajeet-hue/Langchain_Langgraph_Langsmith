import {tool} from "@langchain/core/tools"
import { ChatOpenAI } from "@langchain/openai"
import {z} from "zod"
import dotenv from "dotenv"

dotenv.config();




const llm = new ChatOpenAI({
  apiKey : process.env.OPENAIKEY,
  model : "gpt-4o"
})

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

const llmWithTools = llm.bindTools([add])
const message = await llmWithTools.invoke("What is the sum of 8 and 4?");

console.log("message" , message)


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