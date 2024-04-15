import { Request, Response } from 'express'
import { getLoggedInAdminUserId, getLoggedInUserId } from '../utils'
import firebase from '../config/firebase'
import admin from 'firebase-admin'
import { UserProfileModel } from '../models'
import AdminUserModel from '../models/admin/admin-user'
import * as _ from 'lodash'
import transporter from '../services/mail'
import SettingsModel from '../models/settings'
import webpush from 'web-push'
import { getUserEmail } from '../utils/getUserEmail'
import { EmailCondition } from '../interfaces/email'
import { sendAPIEmail } from '../helpers/sendEmail'

const collectionName = 'wellness-advisor-chat'
const dailyNumberOfMessagesLimit = 3840
const dailyLimitReachedEmails = ['tulip-monitor@meettulip.com', 'tulip-service@meettulip.com']
const limitOfMessagesPerUserPerSec = 10

let isChatActive = true

const vapidKeys = {
  publicKey: 'BITV_uomYhfDU-Iv6UKc1GDMl5QqfK3o8_KRQqPJMMlMFSUeVwEMezaAbnZj1491SnL8xYylsdXx-BLwFb6sZJo',
  privateKey: '16MUoIOX1bgC2gyzaPLRqpXu4gKkJq8mwFcT4toKwx0',
}

webpush.setVapidDetails('mailto:tulip-monitor@meettulip.com', vapidKeys.publicKey, vapidKeys.privateKey)

export const getChatMode = async (req: Request, res: Response) => {
  try {
    const isWellnessChatActive = (
      await SettingsModel.findOne({
        raw: true,
        where: { key: 'IS_WELLNESS_CHAT_ACTIVE' },
      })
    )?.data?.isWellnessChatActive

    return res.send({
      chatMode: isWellnessChatActive ?? true ? 'chat' : 'email',
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const updateChatMode = async (req: Request, res: Response) => {
  try {
    if (
      !(await SettingsModel.findOne({
        raw: true,
        where: { key: 'IS_WELLNESS_CHAT_ACTIVE' },
      }))
    ) {
      await SettingsModel.create({
        key: 'IS_WELLNESS_CHAT_ACTIVE',
        data: { isWellnessChatActive: !!req.body.isChatActive },
      })
    } else {
      await SettingsModel.update(
        { data: { isWellnessChatActive: !!req.body.isChatActive } },
        {
          where: { key: 'IS_WELLNESS_CHAT_ACTIVE' },
        }
      )
    }

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function checkIsChatActive() {
  const isWellnessChatActive = (
    await SettingsModel.findOne({
      raw: true,
      where: { key: 'IS_WELLNESS_CHAT_ACTIVE' },
    })
  )?.data?.isWellnessChatActive

  isChatActive = isWellnessChatActive ?? true
}

export async function calculateWellnessChatWaitingTime() {
  console.log('Running calculateWellnessChatWaitingTime')

  const now = new Date()
  const oneWeekBack = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksBack = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const threeWeeksBack = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)

  const oneWeekBackKey = `${oneWeekBack.getFullYear()}-${
    oneWeekBack.getMonth() + 1
  }-${oneWeekBack.getDate()}-${oneWeekBack.getHours()}`

  const twoWeeksBackKey = `${twoWeeksBack.getFullYear()}-${
    twoWeeksBack.getMonth() + 1
  }-${twoWeeksBack.getDate()}-${twoWeeksBack.getHours()}`

  const threeWeeksBackKey = `${threeWeeksBack.getFullYear()}-${
    threeWeeksBack.getMonth() + 1
  }-${threeWeeksBack.getDate()}-${threeWeeksBack.getHours()}`

  const oneWeekBackData =
    ((
      await firebase.firestore().collection('wellness-advisor-chat-response-times').doc(oneWeekBackKey).get()
    )?.data() ?? {})['responseTimes'] || []

  const twoWeeksBackData =
    ((
      await firebase.firestore().collection('wellness-advisor-chat-response-times').doc(twoWeeksBackKey).get()
    )?.data() ?? {})['responseTimes'] || []

  const threeWeeksBackData =
    ((
      await firebase.firestore().collection('wellness-advisor-chat-response-times').doc(threeWeeksBackKey).get()
    )?.data() ?? {})['responseTimes'] || []

  const responseTimes = [...oneWeekBackData, ...twoWeeksBackData, ...threeWeeksBackData]
  const currentWellnessChatWaitTime = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 900

  await SettingsModel.update(
    { data: { currentWellnessChatWaitTime } },
    {
      where: { key: 'CURRENT_WELLNESS_CHAT_WAIT_TIME' },
    }
  )
}

export const updateMessage = async (req: Request, res: Response) => {
  try {
    const wellnessAdvisorId = getLoggedInAdminUserId(req)
    const wellnessAdvisor = await getWellnessAdvisor(wellnessAdvisorId)

    const chatRoomId = req.body.chatRoomId
    const chatRoom: any = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(404).json({
        message: 'Chat room not found',
      })
    }

    if (!wellnessAdvisor) {
      return res.status(404).json({
        message: 'Wellness advisor not found',
      })
    }

    if (chatRoom.wellnessAdvisorId !== wellnessAdvisorId) {
      return res.status(404).json({
        message: 'You are not assigned to this chat room',
      })
    }

    const read = req.body.read
    const replied = req.body.replied

    const updateData: any = {}

    if (read !== undefined && read !== null) {
      updateData.read = read
      updateData.readAt = read ? new Date() : null
    }

    if (replied !== undefined && replied !== null) {
      updateData.replied = replied
      updateData.repliedAt = replied ? new Date() : null
    }

    await firebase
      .firestore()
      .collection(collectionName)
      .doc(chatRoomId)
      .collection('messages')
      .doc(req.body.messageId)
      .update(updateData)

    const wellnessAdvisorUnreadMessages = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('read', '==', false)
        .where('wellnessAdvisorId', '==', null)
        .get()
    ).size

    const wellnessAdvisorUnrepliedMessages = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('replied', '==', false)
        .where('wellnessAdvisorId', '==', null)
        .get()
    ).size

    await firebase.firestore().collection(collectionName).doc(chatRoomId).update({
      wellnessAdvisorUnreadMessages,
      wellnessAdvisorUnrepliedMessages,
    })

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const wellnessAdvisorId = getLoggedInAdminUserId(req)
    const wellnessAdvisor = await getWellnessAdvisor(wellnessAdvisorId)

    const chatRoomId = req.body.chatRoomId
    const chatRoom: any = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(404).json({
        message: 'Chat room not found',
      })
    }

    if (!wellnessAdvisor) {
      return res.status(404).json({
        message: 'Wellness advisor not found',
      })
    }

    if (chatRoom.wellnessAdvisorId !== wellnessAdvisorId) {
      return res.status(404).json({
        message: 'You are not assigned to this chat room',
      })
    }

    const unreadMessagesSentToWellnessAdvisorIds = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('read', '==', false)
        .where('wellnessAdvisorId', '==', null)
        .get()
    ).docs.map((doc) => doc.id)

    for (const id of unreadMessagesSentToWellnessAdvisorIds) {
      await firebase.firestore().collection(collectionName).doc(chatRoomId).collection('messages').doc(id).update({
        read: true,
        readAt: new Date(),
      })
    }

    await firebase.firestore().collection(collectionName).doc(chatRoomId).update({
      wellnessAdvisorUnreadMessages: 0,
    })

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const markAllAsReplied = async (req: Request, res: Response) => {
  try {
    const wellnessAdvisorId = getLoggedInAdminUserId(req)
    const wellnessAdvisor = await getWellnessAdvisor(wellnessAdvisorId)

    const chatRoomId = req.body.chatRoomId
    const chatRoom: any = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(404).json({
        message: 'Chat room not found',
      })
    }

    if (!wellnessAdvisor) {
      return res.status(404).json({
        message: 'Wellness advisor not found',
      })
    }

    if (chatRoom.wellnessAdvisorId !== wellnessAdvisorId) {
      return res.status(404).json({
        message: 'You are not assigned to this chat room',
      })
    }

    const unreadMessagesSentToWellnessAdvisorIds = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('replied', '==', false)
        .where('wellnessAdvisorId', '==', null)
        .get()
    ).docs.map((doc) => doc.id)

    for (const id of unreadMessagesSentToWellnessAdvisorIds) {
      await firebase.firestore().collection(collectionName).doc(chatRoomId).collection('messages').doc(id).update({
        replied: true,
        repliedAt: new Date(),
      })
    }

    await firebase.firestore().collection(collectionName).doc(chatRoomId).update({
      wellnessAdvisorUnrepliedMessages: 0,
    })

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const markAllClientMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)
    
    const chatRoomQS = await firebase.firestore().collection(collectionName).where('clientId', '==', userId).where('active', '==', true).get()

    if (chatRoomQS.empty) {
      return res.status(404).json({
        message: 'User does not have a wellness advisor chat room',
      })
    }

    if (chatRoomQS.size > 1) {
      return res.status(500).json({
        message: 'Multiple chat rooms found',
      })
    }

    const chatRoomId = chatRoomQS.docs[0].id

    const unreadMessagesSentToWellnessAdvisorIds = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('read', '==', false)
        .where('wellnessAdvisorId', '!=', null)
        .get()
    ).docs.map((doc) => doc.id)

    for (const id of unreadMessagesSentToWellnessAdvisorIds) {
      await firebase.firestore().collection(collectionName).doc(chatRoomId).collection('messages').doc(id).update({
        read: true,
        readAt: new Date(),
      })
    }

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const assignToMe = async (req: Request, res: Response) => {
  try {
    const wellnessAdvisorId = getLoggedInAdminUserId(req)
    const wellnessAdvisor = await getWellnessAdvisor(wellnessAdvisorId)

    const chatRoomId = req.body.chatRoomId
    const chatRoom: any = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(404).json({
        message: 'Chat room not found',
      })
    }

    if (!wellnessAdvisor) {
      return res.status(404).json({
        message: 'Wellness advisor not found',
      })
    }

    try {
      if (chatRoom.wellnessAdvisorId !== wellnessAdvisorId) {
        await assignWellnessAdvisor(chatRoom, wellnessAdvisor)
      }
    } catch (e: any) {
      return res.status(400).json({
        message: e.message,
      })
    }

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const getCurrentWaitTime = async (req: Request, res: Response) => {
  try {
    const settings = await SettingsModel.findOne({
      raw: true,
      where: { key: 'CURRENT_WELLNESS_CHAT_WAIT_TIME' },
    })

    return res.status(200).json({ currentWellnessChatWaitTime: settings?.data?.currentWellnessChatWaitTime ?? null })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const getChatRoomOfLoggedInUser = async (req: Request, res: Response) => {
  console.log('getChatRoomOfLoggedInUser ----');
  
  try {
    const userId = getLoggedInUserId(req)

    const chatRoomQS = await firebase.firestore().collection(collectionName).where('clientId', '==', userId).where('active', '==', true).get()

    if (chatRoomQS.empty) {
      const lastActiveChatRoomQS = await firebase.firestore().collection(collectionName).where('clientId', '==', userId).orderBy('createdAt', 'desc').get()

      if (lastActiveChatRoomQS.empty) {
        return res.status(200).json({
          id: null,
        })
      }

      const id = lastActiveChatRoomQS.docs[0].id

      const lastActiveChatRoomMessagesQS = await firebase.firestore().collection(collectionName).doc(id).collection('messages').where('wellnessAdvisorId', '!=', null).get()

      if(!lastActiveChatRoomMessagesQS.empty && lastActiveChatRoomMessagesQS.docs[lastActiveChatRoomMessagesQS.docs.length - 1].data().wellnessAdvisorId) {
        return res.send({
          id
        })
      }

      return res.status(200).json({
        id: null,
      })
    }

    if (chatRoomQS.size > 1) {
      return res.status(500).json({
        message: 'Multiple chat rooms found',
      })
    }

    return res.send({
      id: chatRoomQS.docs[0].id,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const sendMessageFromAdvisor = async (req: Request, res: Response) => {
  try {
    const wellnessAdvisorId = getLoggedInAdminUserId(req)
    const wellnessAdvisor = await getWellnessAdvisor(wellnessAdvisorId)

    const chatRoomId = req.body.chatRoomId
    const chatRoom: any = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(404).json({
        message: 'Chat room not found',
      })
    }

    if (!wellnessAdvisor) {
      return res.status(404).json({
        message: 'Wellness advisor not found',
      })
    }

    if (chatRoom.wellnessAdvisorId !== wellnessAdvisorId) {
      await assignWellnessAdvisor(chatRoom, wellnessAdvisor)
    }

    const message = await insertMessage(chatRoomId, req.body.text, wellnessAdvisor.id, wellnessAdvisor.name)
    
    res.json({
      messageId: message.id,
      chatRoomId,
      text: message.text,
      sentAt: message.sentAt,
      repliedTo: null,
      read: false,
      replied: false,
    })

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const closeSessionFromAdvisor = async (req: Request, res: Response) => {
  try {
    const chatRoomId = req.body.chatRoomId

    const wellnessAdvisorId = getLoggedInAdminUserId(req)
    const wellnessAdvisor = await getWellnessAdvisor(wellnessAdvisorId)

    const chatRoom: any = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(404).json({
        message: 'Chat room not found',
      })
    }

    await firebase.firestore().collection(collectionName).doc(chatRoomId).update({
      active: false,
      closedAt: new Date(),
      closedBy: wellnessAdvisorId,
      closedByType: 'wellnessAdvisor',
    })

    const insert: any = {
      text: `Session closed by ${wellnessAdvisor?.name}`,
      sentAt: new Date(),
      read: true,
      replied: true,
      readAt: null,
      repliedAt: null,
      wellnessAdvisorId: wellnessAdvisorId || null,
      wellnessAdvisorName: wellnessAdvisor?.name,
      isFirstMessage: false,
      isSessionClosingMessage: true,
    }
  
    const firebaseDoc = firebase.firestore().collection(collectionName).doc(chatRoomId).collection('messages').doc()
  
    await firebaseDoc.set(insert)

    const email = await getUserEmail(chatRoom.clientId)
    const mails = [{
      email: email,
      name: chatRoom.clientFirstName
    }]
    await sendAPIEmail(mails, EmailCondition.AdvisorChat)
  
    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const closeSessionFromUser = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)

    const activeChatRooms = (await firebase.firestore().collection(collectionName).where('clientId', '==', userId).where('active', '==', true).get()).docs.map(doc => ({...doc.data(), id: doc.id}))

    if (activeChatRooms.length === 0) {
      return res.status(404).json({
        msg: 'You do not have a chat room.',
      })
    }

    if (activeChatRooms.length > 1) {
      return res.status(404).json({
        msg: 'You have multiple chat rooms.',
      })
    }

    const chatRoom: any = activeChatRooms[0]

    await firebase.firestore().collection(collectionName).doc(chatRoom.id).update({
      active: false,
      closedAt: new Date(),
      closedBy: userId,
      closedByType: 'user',
    })

    const insert: any = {
      text: `Session closed by ${chatRoom?.clientFirstName}`,
      sentAt: new Date(),
      read: true,
      replied: true,
      readAt: null,
      repliedAt: null,
      wellnessAdvisorId: null,
      wellnessAdvisorName: null,
      isFirstMessage: false,
      isSessionClosingMessage: true,
    }
  
    const firebaseDoc = firebase.firestore().collection(collectionName).doc(chatRoom.id).collection('messages').doc()
  
    await firebaseDoc.set(insert)
  
    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const sendMessageFromClient = async (req: Request, res: Response) => {
  try {
    if (isChatActive === false) {
      await checkIsChatActive()

      if (isChatActive === false) {
        return res.status(400).json({
          message: 'Chat is not active. Chat is on email mode.',
        })
      }
    }

    const userId = getLoggedInUserId(req)
    const text = req.body.text

    if (!userId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    const chatRoomQS = await firebase.firestore().collection(collectionName).where('clientId', '==', userId).where('active', '==', true).get()

    if (chatRoomQS.empty) {
      return res.status(404).json({
        message: 'User does not have a wellness advisor chat room',
      })
    }

    if (chatRoomQS.size > 1) {
      return res.status(500).json({
        message: 'Multiple chat rooms found',
      })
    }

    const chatRoom = { ...chatRoomQS.docs[0]?.data(), id: chatRoomQS.docs[0]?.id }
    const chatRoomId = chatRoom.id

    const message = await insertMessage(chatRoomId, text)

    await sendBrowserNotification(chatRoom, message)

    res.json({
      messageId: message.id,
      chatRoomId,
      text: message.text,
      sentAt: message.sentAt,
      repliedTo: null,
      read: false,
      replied: false,
    })

    checkIsChatActive()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const createChatRoom = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)
    
    if (!userId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    if (!(await firebase.firestore().collection(collectionName).where('clientId', '==', userId).where('active', '==', true).get()).empty) {
      return res.status(404).json({
        msg: 'You already have a chat room.',
      })
    }

    const chat = await initWellnessAdvisorChat(userId, req.body.isLiveChat??true)

    //calculateQueuePositions()

    const message = await insertMessage(chat.chatRoomId, `${chat.clientFirstName??''} ${chat.clientLastName??''} is trying to connect...`, null, null, true)

    res.json({
      messageId: message.id,
      chatRoomId: chat.chatRoomId,
      text: message.text,
      sentAt: message.sentAt,
      repliedTo: null,
      read: false,
      replied: false,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const setChatRoomToLive = async (req: Request, res: Response) => {
  try {
    const userId = getLoggedInUserId(req)
    
    if (!userId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    const activeChatRooms = (await firebase.firestore().collection(collectionName).where('clientId', '==', userId).where('active', '==', true).get()).docs.map(doc => ({...doc.data(), id: doc.id}))

    if (activeChatRooms.length === 0) {
      return res.status(404).json({
        msg: 'You do not have a chat room.',
      })
    }

    if (activeChatRooms.length > 1) {
      return res.status(404).json({
        msg: 'You have multiple chat rooms.',
      })
    }

    await firebase.firestore().collection(collectionName).doc(activeChatRooms[0].id).update({
      isLiveChat: true,
    })

    res.send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function calculateQueuePositions() {
  const unassignedChats = await firebase.firestore().collection(collectionName).where('wellnessAdvisorId', '==', null).orderBy('createdAt').get()

  let queuePosition = 1

  for (const chat of unassignedChats.docs) {
    await firebase.firestore().collection(collectionName).doc(chat.id).update({
      queuePosition,
    })

    queuePosition++
  }
}

async function assignWellnessAdvisor(chatRoom: any, wellnessAdvisor: any) {
  if (chatRoom.wellnessAdvisorId === wellnessAdvisor.id) {
    return
  }

  if (chatRoom.wellnessAdvisorId && chatRoom.lastAdvisorAssigmentAt) {
    const diffMins = Math.round(
      (new Date().getTime() - chatRoom.lastAdvisorAssigmentAt?.toDate().getTime()) / 1000 / 60
    )

    if (diffMins < 30) {
      throw new Error(
        'You cannot change the wellness advisor assignment within 30 minutes of the last assignment change.'
      )
    }
  }

  await firebase.firestore().collection(collectionName).doc(chatRoom.id).update({
    wellnessAdvisorId: wellnessAdvisor.id,
    wellnessAdvisorName: wellnessAdvisor.name,
    wellnessAdvisorProfileImage: wellnessAdvisor.profileImage,
    lastAdvisorAssigmentAt: new Date(),
  })

  calculateQueuePositions()
}

async function getChatRoom(chatRoomId: string) {
  const ds = await firebase.firestore().collection(collectionName).doc(chatRoomId).get()

  if (ds.exists) {
    return {
      ...ds.data(),
      id: ds.id,
    }
  }

  return null
}

async function getWellnessAdvisor(wellnessAdvisorId: string) {
  const wellnessAdvisor = await AdminUserModel.findOne({ raw: true, where: { id: wellnessAdvisorId } })

  if (wellnessAdvisor) {
    return {
      id: wellnessAdvisor.id,
      name: wellnessAdvisor.name,
      profileImage: wellnessAdvisor.profile_image,
    }
  }

  return null
}

async function initWellnessAdvisorChat(userId: number, isLiveChat: boolean) {
  const userData = await UserProfileModel.findOne({
    raw: true,
    where: {
      user_id: userId,
    },
  })

  const settings = await SettingsModel.findOne({
    raw: true,
    where: { key: 'CURRENT_WELLNESS_CHAT_WAIT_TIME' },
  })

  const firebaseDoc = firebase.firestore().collection(collectionName).doc()

  const firestoreData = {
    clientId: userId,
    clientFirstName: userData?.first_name || userData?.data?.first_name || null,
    clientLastName: userData?.last_name || userData?.data?.last_name || null,
    clientProfileImage: userData?.profile_image || userData?.data?.profile_image || null,
    createdAt: new Date(),
    lastClientMessageSentAt: null,
    lastWellnessAdvisorMessageSentAt: null,
    wellnessAdvisorUnreadMessages: 0,
    wellnessAdvisorUnrepliedMessages: 0,
    wellnessAdvisorId: null,
    wellnessAdvisorName: null,
    wellnessAdvisorProfileImage: null,
    lastAdvisorAssigmentAt: null,
    estimatedTime: settings?.data?.currentWellnessChatWaitTime ?? null,
    isLiveChat,
    active: true
  }

  await firebaseDoc.set(firestoreData)

  return { ...firestoreData, chatRoomId: firebaseDoc.id }
}

async function sendBrowserNotification(chatRoom: any, message: any) {
  if (!chatRoom?.wellnessAdvisorId || !message?.text) {
    return
  }

  const wellnessAdvisor = await AdminUserModel.findOne({ raw: true, where: { id: chatRoom?.wellnessAdvisorId } })

  if (!wellnessAdvisor?.push_subscription) {
    return
  }

  const notificationPayload = {
    notification: {
      title: 'Wellness Chat Message',
      body: message.text,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
    },
  }
  try{
    await webpush.sendNotification(wellnessAdvisor.push_subscription, JSON.stringify(notificationPayload))
  }
  catch(e){
    console.error(e)
  }  
}

async function insertMessage(
  chatRoomId: string,
  text: string,  
  wellnessAdvisorId?: number | undefined | null,
  wellnessAdvisorName?: number | undefined | null,
  isFirstMessage?: boolean
) {
  if (!(await allowMessage(chatRoomId))) {
    throw new Error('DoS detected.')
  }

  if (!wellnessAdvisorId) {
    const currDate = new Date()
    const docId = `${currDate.getFullYear()}-${currDate.getMonth() + 1}-${currDate.getDate()}`

    const doc = await firebase.firestore().collection('wellness-advisor-chat-number-of-messages').doc(docId).get()

    if (doc.exists) {
      if (doc.data()?.numberOfMessages >= dailyNumberOfMessagesLimit) {
        if (!doc.data()?.alertSent) {
          await firebase.firestore().collection('wellness-advisor-chat-number-of-messages').doc(docId).update({
            alertSent: true,
          })
          await reportDailyLimitReached()
        }
      }

      await firebase
        .firestore()
        .collection('wellness-advisor-chat-number-of-messages')
        .doc(docId)
        .update({
          numberOfMessages: admin.firestore.FieldValue.increment(1),
        })
    } else {
      await firebase.firestore().collection('wellness-advisor-chat-number-of-messages').doc(docId).create({
        numberOfMessages: 1,
      })
    }
  }

  const insert: any = {
    text,
    sentAt: new Date(),
    read: false,
    replied: false,
    readAt: null,
    repliedAt: null,
    wellnessAdvisorId: wellnessAdvisorId || null,
    wellnessAdvisorName: wellnessAdvisorName || null,
    isFirstMessage: isFirstMessage ?? false,
  }

  const firebaseDoc = firebase.firestore().collection(collectionName).doc(chatRoomId).collection('messages').doc()

  await firebaseDoc.set(insert)

  await firebase
    .firestore()
    .collection(collectionName)
    .doc(chatRoomId)
    .update(
      wellnessAdvisorId
        ? {
            lastWellnessAdvisorMessageSentAt: new Date(),
            wellnessAdvisorUnreadMessages: 0,
            wellnessAdvisorUnrepliedMessages: 0,
          }
        : {
            wellnessAdvisorUnreadMessages: admin.firestore.FieldValue.increment(1),
            wellnessAdvisorUnrepliedMessages: admin.firestore.FieldValue.increment(1),
            lastClientMessageSentAt: new Date(),
          }
    )

  if (wellnessAdvisorId) {
    const unreadMessagesSentToWellnessAdvisorIds = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('read', '==', false)
        .where('wellnessAdvisorId', '==', null)
        .get()
    ).docs.map((doc) => doc.id)

    const unrepliedMessagesSentToWellnessAdvisorIds = (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('replied', '==', false)
        .where('wellnessAdvisorId', '==', null)
        .get()
    ).docs.map((doc) => doc.id)

    const unreadOrUnrepliedMessagesSentToWellnessAdvisorIds = _.uniq([
      ...unreadMessagesSentToWellnessAdvisorIds,
      ...unrepliedMessagesSentToWellnessAdvisorIds,
    ])

    for (const id of unreadOrUnrepliedMessagesSentToWellnessAdvisorIds) {
      await firebase.firestore().collection(collectionName).doc(chatRoomId).collection('messages').doc(id).update({
        read: true,
        readAt: new Date(),
        replied: true,
        repliedAt: new Date(),
      })
    }

    await updateResponseTimes(chatRoomId)
  }

  return { ...insert, id: firebaseDoc.id }
}

async function reportDailyLimitReached() {
  for (const email of dailyLimitReachedEmails) {
    await transporter.sendMail({
      from: 'noreply@meettulip.com',
      to: email,
      text: 'From Tulip',
      subject: 'Wellness Advisor Chat Daily Limit Reached',
      html: `The daily limit of Wellness Advisor Chat messages has been reached. The current limit is set to ${dailyNumberOfMessagesLimit}.`,
    })
  }
}

async function updateResponseTimes(chatRoomId: string) {
  const lastRepliedMessage = await firebase
    .firestore()
    .collection(collectionName)
    .doc(chatRoomId)
    .collection('messages')
    .where('wellnessAdvisorId', '==', null)
    .where('replied', '==', true)
    .orderBy('sentAt', 'desc')
    .limit(1)
    .get()

  if (!lastRepliedMessage.empty) {
    const sentAt = lastRepliedMessage.docs[0].data()?.sentAt?.toDate()
    const repliedAt = lastRepliedMessage.docs[0].data()?.repliedAt?.toDate()

    const diff = (repliedAt.getTime() - sentAt.getTime()) / 1000

    const key = `${sentAt.getFullYear()}-${sentAt.getMonth() + 1}-${sentAt.getDate()}-${sentAt.getHours()}`

    try {
      await firebase
        .firestore()
        .collection('wellness-advisor-chat-response-times')
        .doc(key)
        .update({
          responseTimes: admin.firestore.FieldValue.arrayUnion(diff),
        })
    } catch (e) {
      await firebase
        .firestore()
        .collection('wellness-advisor-chat-response-times')
        .doc(key)
        .set({
          responseTimes: [diff],
        })
    }
  }
}

async function allowMessage(chatRoomId: string) {
  return (
    (
      await firebase
        .firestore()
        .collection(collectionName)
        .doc(chatRoomId)
        .collection('messages')
        .where('sentAt', '>', new Date(new Date().getTime() - 1000))
        .get()
    ).docs.length < limitOfMessagesPerUserPerSec
  )
}

