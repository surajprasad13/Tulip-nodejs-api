import { Request, Response } from 'express'
import DoctorChatModel from '../../models/doctor-chat'
import * as _ from 'lodash'
import { findAllMessages, getDoctorId } from '../doctor-chat'
import AdminUserModel from '../../models/admin/admin-user'
import DoctorChatMessagesModel from '../../models/doctor-chat-messages'
import { UserProfileModel } from '../../models'
import { Op } from 'sequelize'
import { getLoggedInAdminUserId } from '../../utils'

export const listMessages = async (req: Request, res: Response) => {
  try {
    const chatRoomId = parseInt(req.params.id ?? '0')

    const chatRoom = await getChatRoom(chatRoomId)

    if (!chatRoom) {
      return res.status(400).json({
        msg: 'Chat room not found',
      })
    }
    const userId = chatRoom?.client_id

    const userName = (await getUserName(userId)) ?? 'USER NAME NOT FOUND'

    const userData = ((await getUsersProfileData(userId)) ?? {})[userId]

    const doctorName = await getDoctorName(chatRoom.doctor_id)

    res.json(
      (await findAllMessages(chatRoomId)).map((m: any) => ({
        ...m,
        doctorId: chatRoom.doctor_id,
        doctorName,
        userId,
        userName,
        userProfileImage: userData && userData.profileImage ? userData.profileImage : null,
        userFirstName: userData && userData.firstName ? userData.firstName : null,
        userLastName: userData && userData.lastName ? userData.lastName : null,
      }))
    )
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function getDoctorName(doctorId: number) {
  return (await AdminUserModel.findOne({ where: { id: doctorId } }))?.name
}

async function getAllDoctorsData() {
  return ((await AdminUserModel.findAll({ raw: true })) || []).reduce((acc: any, curr: any) => {
    acc[curr.id] = {
      id: curr.id,
      name: curr.name,
      profileImage: curr.profile_image,
    }
    return acc
  }, {})
}

export async function getUserName(userId: number) {
  const userProfile = await UserProfileModel.findOne({ raw: true, where: { user_id: userId } })

  if (userProfile) {
    return `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`
  }

  return null
}

export async function getChatRoom(chatRoomId: number) {
  return await DoctorChatModel.findOne({
    raw: true,
    where: {
      doctor_chat_id: chatRoomId,
    },
  })
}

export const doctorUpdateMessage = async (req: Request, res: Response) => {
  try {
    const read = req.body.read
    const replied = req.body.replied

    const doctorId = getDoctorId(req)

    const messageId = parseInt(req.params.id ?? '0')

    const message = await DoctorChatMessagesModel.findOne({
      raw: true,
      where: { doctor_chat_message_id: messageId },
    })

    if (!message) {
      return res.status(400).json({
        msg: 'Message not found',
      })
    }

    const chat = await DoctorChatModel.findOne({ raw: true, where: { doctor_chat_id: message.doctor_chat_id } })

    if (!chat) {
      return res.status(400).json({
        msg: 'Chat not found',
      })
    }

    if (chat.doctor_id !== doctorId) {
      return res.status(400).json({
        msg: 'The chat is assigned to another doctor',
      })
    }

    const updateData: any = {}

    if (read === true || read === false) {
      updateData.read = read
    }

    if (replied === true || replied === false) {
      updateData.replied = replied
    }

    await DoctorChatMessagesModel.update(updateData, { where: { doctor_chat_message_id: messageId } })

    const countUnreadMessages = (
      (await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_chat_id: message.doctor_chat_id,
          doctor_id: null,
          read: false,
        },
      })) || []
    ).length

    const countUnrepliedMessages = (
      (await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_id: null,
          doctor_chat_id: message.doctor_chat_id,
          replied: false,
        },
      })) || []
    ).length

    await DoctorChatModel.update(
      { doctor_unread_messages: countUnreadMessages, doctor_unreplied_messages: countUnrepliedMessages },
      { where: { doctor_chat_id: chat.doctor_chat_id } }
    )

    res.status(200).send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const doctorMarkAllMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req)

    const chatId = parseInt(req.params.id ?? '0')

    const chat = await DoctorChatModel.findOne({ raw: true, where: { doctor_chat_id: chatId } })

    if (!chat) {
      return res.status(400).json({
        msg: 'Chat not found',
      })
    }

    if (chat.doctor_id !== doctorId) {
      return res.status(200).json({
        msg: 'The chat is assigned to another doctor',
      })
    }

    await DoctorChatMessagesModel.update({ read: true }, { where: { doctor_chat_id: chatId } })
    await DoctorChatModel.update({ doctor_unread_messages: 0 }, { where: { doctor_chat_id: chat.doctor_chat_id } })

    res.status(200).send()
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const listChats = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req)

    const chats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        doctor_id: doctorId,
      },
    })

    const usersNames = await getUsersNames(_.uniq(chats.map((c: any) => c.client_id)))

    const userData = await getUsersProfileData(_.uniq(chats.map((c: any) => c.client_id)))

    res.json(
      chats.map((chat: any) => ({
        chatRoomId: chat.doctor_chat_id,
        userId: chat.client_id,
        userName: usersNames[chat.client_id] ?? 'USER NAME NOT FOUND',
        userProfileImage:
          userData[chat.client_id] && userData[chat.client_id].profileImage
            ? userData[chat.client_id].profileImage
            : null,
        userFirstName:
          userData[chat.client_id] && userData[chat.client_id].firstName ? userData[chat.client_id].firstName : null,
        userLastName:
          userData[chat.client_id] && userData[chat.client_id].lastName ? userData[chat.client_id].lastName : null,
        lastClientMessageSentAt: chat.last_client_message_sent_at,
        lastDoctorMessageSentAt: chat.last_doctor_message_sent_at,
        doctorUnreadMessages: chat.doctor_unread_messages,
        clientUnreadMessages: chat.client_unread_messages,
        doctorUnrepliedMessages: chat.doctor_unreplied_messages,
      }))
    )
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const listAllPendingMessages = async (req: Request, res: Response) => {
  try {
    const pending = { myPendingMessages: [], allDoctorsPendingMessages: [] }
    const doctorId = getLoggedInAdminUserId(req)

    const myPendingChats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        doctor_id: doctorId,
        doctor_unreplied_messages: { [Op.gt]: 0 },
      },
    })

    for (const chat of myPendingChats) {
      chat.messages = await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_chat_id: chat.doctor_chat_id,
          replied: 0,
          doctor_id: { [Op.eq]: null },
        },
      })
    }

    let usersNames = await getUsersNames(_.uniq(myPendingChats.map((c: any) => c.client_id)))

    let userData = await getUsersProfileData(_.uniq(myPendingChats.map((c: any) => c.client_id)))

    pending.myPendingMessages = myPendingChats.map((chat: any) => ({
      chatId: chat.doctor_chat_id,
      clientId: chat.client_id,
      clientName:
        userData[chat.client_id] && (userData[chat.client_id].firstName || userData[chat.client_id].lastName)
          ? `${userData[chat.client_id].firstName ?? ''} ${userData[chat.client_id].lastName ?? ''}`
          : usersNames[chat.client_id],
      clientProfileImage: userData[chat.client_id]?.profileImage,
      messages: chat.messages.map((message: any) => ({
        id: message.doctor_chat_message_id,
        text: message.text,
        attachment: message.attachment,
        sentAt: message.sent_at,
      })),
    }))

    const allDoctorsPendingChats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        doctor_unreplied_messages: { [Op.gt]: 0 },
        doctor_id: { [Op.eq]: null },
      },
    })

    for (const chat of allDoctorsPendingChats) {
      chat.messages = await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_chat_id: chat.doctor_chat_id,
          replied: 0,
          doctor_id: { [Op.eq]: null },
        },
      })
    }

    usersNames = await getUsersNames(_.uniq(allDoctorsPendingChats.map((c: any) => c.client_id)))

    userData = await getUsersProfileData(_.uniq(allDoctorsPendingChats.map((c: any) => c.client_id)))

    pending.allDoctorsPendingMessages = allDoctorsPendingChats.map((chat: any) => ({
      chatId: chat.doctor_chat_id,
      clientId: chat.client_id,
      clientName:
        userData[chat.client_id] && (userData[chat.client_id].firstName || userData[chat.client_id].lastName)
          ? `${userData[chat.client_id].firstName ?? ''} ${userData[chat.client_id].lastName ?? ''}`
          : usersNames[chat.client_id],
      clientProfileImage: userData[chat.client_id]?.profileImage,
      messages: chat.messages.map((message: any) => ({
        id: message.doctor_chat_message_id,
        text: message.text,
        attachment: message.attachment,
        sentAt: message.sent_at,
      })),
    }))

    res.json(pending)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const listAllChats = async (req: Request, res: Response) => {
  try {
    const chats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        doctor_id: { [Op.ne]: null },
      },
    })

    const usersNames = await getUsersNames(_.uniq(chats.map((c: any) => c.client_id)))

    const userData = await getUsersProfileData(_.uniq(chats.map((c: any) => c.client_id)))

    const doctorsData = await getAllDoctorsData()

    res.json(
      chats.map((chat: any) => ({
        chatRoomId: chat.doctor_chat_id,
        userId: chat.client_id,
        userName: usersNames[chat.client_id] ?? 'USER NAME NOT FOUND',
        userProfileImage:
          userData[chat.client_id] && userData[chat.client_id].profileImage
            ? userData[chat.client_id].profileImage
            : null,
        userFirstName:
          userData[chat.client_id] && userData[chat.client_id].firstName ? userData[chat.client_id].firstName : null,
        userLastName:
          userData[chat.client_id] && userData[chat.client_id].lastName ? userData[chat.client_id].lastName : null,
        lastClientMessageSentAt: chat.last_client_message_sent_at,
        lastDoctorMessageSentAt: chat.last_doctor_message_sent_at,
        doctorUnreadMessages: chat.doctor_unread_messages,
        clientUnreadMessages: chat.client_unread_messages,
        doctorUnrepliedMessages: chat.doctor_unreplied_messages,
        doctorId: chat.doctor_id,
        doctorName: doctorsData[chat.doctor_id]?.name,
        doctorProfileImage: doctorsData[chat.doctor_id]?.profileImage,
      }))
    )
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const listPendingChats = async (req: Request, res: Response) => {
  try {
    const chats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        doctor_id: null,
      },
      order: [['doctor_chat_id', 'DESC']],
    })

    const usersNames = await getUsersNames(_.uniq(chats.map((c: any) => c.client_id)))

    const userData = await getUsersProfileData(_.uniq(chats.map((c: any) => c.client_id)))

    res.json(
      chats.map((chat: any) => ({
        chatRoomId: chat.doctor_chat_id,
        userId: chat.client_id,
        doctorId: chat.doctor_id,
        userName: usersNames[chat.client_id] ?? 'USER NAME NOT FOUND' + chat.client_id,
        userProfileImage:
          userData[chat.client_id] && userData[chat.client_id].profileImage
            ? userData[chat.client_id].profileImage
            : null,
        userFirstName:
          userData[chat.client_id] && userData[chat.client_id].firstName ? userData[chat.client_id].firstName : null,
        userLastName:
          userData[chat.client_id] && userData[chat.client_id].lastName ? userData[chat.client_id].lastName : null,
        lastClientMessageSentAt: chat.last_client_message_sent_at,
        lastDoctorMessageSentAt: chat.last_doctor_message_sent_at,
        doctorUnreadMessages: chat.doctor_unread_messages,
        clientUnreadMessages: chat.client_unread_messages,
        doctorUnrepliedMessages: chat.doctor_unreplied_messages,
      }))
    )
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export async function getUsersNames(usersIds: Array<number>) {
  return (
    (await UserProfileModel.findAll({ raw: true, where: { user_id: usersIds } })).map((d: any) => ({
      id: d.user_id,
      name: d.first_name ?? '' + d.last_name ?? '',
    })) || []
  ).reduce((acc: any, curr: any) => {
    acc[curr.id] = curr.name
    return acc
  }, {})
}

export async function getUsersProfileData(usersIds: Array<number>) {
  return (
    (await UserProfileModel.findAll({ raw: true, where: { user_id: usersIds, profile_image: { [Op.ne]: null } } })).map(
      (d: any) => ({
        id: d.user_id,
        profileImage: (d.profile_image ?? '').replace(/\"/g, ''),
        firstName: d.first_name,
        lastName: d.last_name,
        deviceToken: d.device_tokens,
      })
    ) || []
  ).reduce((acc: any, curr: any) => {
    acc[curr.id] = curr
    return acc
  }, {})
}
