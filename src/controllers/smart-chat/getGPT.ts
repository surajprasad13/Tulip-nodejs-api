import { Request, Response } from "express";
import { getResponse } from "./getResponse";
import SmartChat from "../../models/smart_chat";
import { getShortChatStreamed } from "./short-chat-stream";

export const getGPT = async (req: Request, res: Response) => {
  try {
    const chatArray = req.body.chat;
    const session_id = +req.body.session_id;

    if (session_id) {
      await SmartChat.create({
        session_id,
        messages: chatArray,
      });
    }

    // const response = await getResponse(chatArray);

    // if(chatArray.length >= 4){
    // 	response.choices[0].message.content += '#'
    // }

    // res.status(200).json({ message: response });
    let stream;
    if (req.body?.isAyurveda) {
      stream = await getResponse(chatArray, req.body.isAyurveda);
    } else {
      stream = await getResponse(chatArray);
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const message of stream) {
      res.write(message.choices[0].delta?.content ?? "");
    }
    res.end();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};

export const getCardGPTStreamed = async (req: Request, res: Response) => {
  try {
    const { card, chat } = req.body;

    if (!chat) {
      res.status(400).json({ message: "Invalid or missing chat history" });
      return;
    }
    if (!card && (card < 1 || card > 6)) {
      res.status(400).json({ message: "Invalid or missing card number" });
      return;
    }

    const stream = await getShortChatStreamed(card, chat);

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const message of stream) {
      res.write(message.choices[0].delta?.content ?? "");
    }
    res.end();
  } catch (error: any) {
    console.log("error", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
};
