import { Request, Response } from 'express'
import AWS from 'aws-sdk'
import { verify } from 'jsonwebtoken'
import DoctorChatModel from '../models/doctor-chat'
import DoctorChatMessagesModel from '../models/doctor-chat-messages'
import * as _ from 'lodash'
import AdminUserModel from '../models/admin/admin-user'
import { getChatRoom, getUserName, getUsersProfileData } from './admin/doctor-chat'
import { Op } from 'sequelize'
import { NotificationModel, UserNotificationModel, UserProfileModel } from '../models'
import firebase from '../config/firebase'
import config from '../config'

export const listChatRooms = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const doctorId = parseInt(req.params.id)

    const doctorsData = await getDoctorsData([doctorId])

    const chats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        client_id: userId,
        doctor_id: doctorId,
      },
    })

    for (const chat of chats) {
      chat.firstMessage = ((await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_chat_id: chat.doctor_chat_id,
        },
        order: [['doctor_chat_message_id', 'ASC']],
        limit: 1,
      })) || [])[0]

      chat.firstMessage.attachment = chat.firstMessage.attachment
        ? `/minitulip/doctor-chat/attachment/${chat.firstMessage.doctor_chat_message_id}`
        : null

      chat.lastMessage = ((await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_chat_id: chat.doctor_chat_id,
        },
        order: [['doctor_chat_message_id', 'DESC']],
        limit: 1,
      })) || [])[0]

      chat.lastMessage.attachment = chat.lastMessage.attachment
        ? `/minitulip/doctor-chat/attachment/${chat.lastMessage.doctor_chat_message_id}`
        : null
    }

    res.json(
      chats.map((chat: any) => ({
        chatRoomId: chat.doctor_chat_id,
        doctorId: chat.doctor_id,
        doctorName: doctorId === null ? null : doctorsData[doctorId]?.name ?? '',
        doctorProfileImage: doctorId === null ? null : doctorsData[doctorId]?.profileImage ?? '',
        doctorDesignation: doctorId === null ? null : doctorsData[doctorId]?.designation ?? '',
        firstMessage: {
          messageId: chat.firstMessage?.doctor_chat_message_id,
          text: chat.firstMessage?.text,
          attachment: chat.firstMessage?.attachment,
          sentAt: chat.firstMessage?.sent_at,
          isDoctorMessage: !!chat.firstMessage?.doctor_id,
          isClientMessage: !chat.firstMessage?.doctor_id,
        },
        lastMessage: {
          messageId: chat.lastMessage?.doctor_chat_message_id,
          text: chat.lastMessage?.text,
          attachment: chat.lastMessage?.attachment,
          sentAt: chat.lastMessage?.sent_at,
          isDoctorMessage: !!chat.lastMessage?.doctor_id,
          isClientMessage: !chat.lastMessage?.doctor_id,
        },
        clientUnreadMessages: chat.client_unread_messages,
      }))
    )
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const listDoctorsAndUnrepliedMessages = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const chats = await DoctorChatModel.findAll({
      raw: true,
      where: {
        client_id: userId,
      },
    })

    const chatsWithoutDoctor = chats
      .filter((c: any) => c.doctor_id === null)
      .map((c: any) => ({
        chatRoomId: c.doctor_chat_id,
        messages: [],
      }))

    for (const chat of chatsWithoutDoctor) {
      const unrepliedMessages = await DoctorChatMessagesModel.findAll({
        raw: true,
        where: {
          doctor_chat_id: chat.chatRoomId,
        },
      })

      chat.messages = unrepliedMessages.map((m: any) => ({
        messageId: m.doctor_chat_message_id,
        text: m.text,
        attachment: m.attachment,
        sentAt: m.sent_at,
      }))
    }

    const doctorsData = await getDoctorsData(_.uniq(chats.map((c: any) => c.doctor_id)))

    const doctors: Array<any> = _.uniq(
      chats
        .filter((c: any) => c.doctor_id)
        .map((c: any) => ({
          doctorId: c.doctor_id,
          doctorUnreadMessages: c.doctor_unread_messages,
          clientUnreadMessages: c.client_unread_messages,
          doctorName: c.doctor_id === null ? null : doctorsData[c.doctor_id]?.name ?? '',
        }))
    )

    const doctorsUniq: any = {}

    for (const doctor of doctors) {
      const lastMessage = await getLastMessageBetweenUserAndDoctor(userId, doctor.doctorId)

      doctor.lastMessageText = lastMessage?.text
      doctor.lastMessageSentAt = lastMessage?.sent_at
      doctor.designation = doctorsData[doctor.doctorId]?.designation
      doctor.profileImage = doctorsData[doctor.doctorId]?.profileImage
        ? `/minitulip/admin-auth/doctors/${doctor.doctorId}/profile-image/`
        : null

      if (doctorsUniq[doctor.doctorId]) {
        if (parseInt(doctorsUniq[doctor.doctorId].doctorUnreadMessages)) {
          doctorsUniq[doctor.doctorId].doctorUnreadMessages += doctor.doctorUnreadMessages
        } else {
          doctorsUniq[doctor.doctorId].doctorUnreadMessages = doctor.doctorUnreadMessages
        }

        if (parseInt(doctorsUniq[doctor.doctorId].clientUnreadMessages)) {
          doctorsUniq[doctor.doctorId].clientUnreadMessages += doctor.clientUnreadMessages
        } else {
          doctorsUniq[doctor.doctorId].clientUnreadMessages = doctor.clientUnreadMessages
        }
      } else {
        doctorsUniq[doctor.doctorId] = doctor
      }
    }

    res.json({
      doctors: Object.values(doctorsUniq),
      unrepliedMessages: chatsWithoutDoctor,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function getDoctorInfo(doctorId: number) {
  const doc =
    (await AdminUserModel.findOne({
      raw: true,
      where: { id: doctorId },
    })) || null

  return doc
}

async function getLastMessageBetweenUserAndDoctor(userId: number, doctorId: number) {
  let lastMessage

  const chat = ((await DoctorChatModel.findAll({
    raw: true,
    where: {
      client_id: userId,
      doctor_id: doctorId,
    },
  })) || [])[0]

  if (chat && chat.doctor_chat_id) {
    lastMessage = ((await DoctorChatMessagesModel.findAll({
      raw: true,
      order: [['doctor_chat_message_id', 'DESC']],
      limit: 1,
      where: {
        doctor_chat_id: chat.doctor_chat_id,
      },
    })) || [])[0]
  }

  return lastMessage
}

export const getAttachment = async (req: Request, res: Response) => {
  try {
    if (req.body.payload?.roles?.length) {
      req.body.payload.isAdmin = req.body.payload.roles.includes('ROOT_ADMIN')
    }

    const messageId = parseInt(req.params.id ?? '0')
    const userId = getUserId(req) || req.body.payload.user_id
    let doctorId = null

    if (!userId) {
      doctorId = getDoctorId(req) || req.body.payload.user_id

      if (!doctorId) {
        return res.status(404).json({
          msg: 'Unable to get user or doctor id.',
        })
      }
    }

    const attachmentURL = await getAttachmentURL(messageId)

    if (!attachmentURL) {
      return res.status(404).json({
        msg: 'Unable to get attachment URL.',
      })
    }

    const file = await downloadFileFromS3(attachmentURL)

    if (!file) {
      return res.status(404).json({
        msg: 'File not find.',
      })
    }

    const attachmentURLParts = attachmentURL.split('/')

    res.setHeader('Content-disposition', 'attachment; filename=' + attachmentURLParts[attachmentURLParts.length - 1])
    res.setHeader('Access-Control-Expose-Headers', 'Content-disposition')
    res.send(file)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)

    const chatRoomId = parseInt(req.params.id)

    if (!userId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    if (!chatRoomId) {
      return res.status(404).json({
        msg: 'Unable to get doctor chat id.',
      })
    }

    const messages = await findAllMessages(chatRoomId)

    await markAllClientMessagesAsRead(chatRoomId)

    res.json(messages)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

export const createChatRoom = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const text = req.body.text

    let attachment = null

    if (!userId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    if (!text && !req.file) {
      return res.status(404).json({
        msg: 'You should send a text or an attachment.',
      })
    }

    const doctorChat = await initDoctorChat(userId)

    if (req.file) {
      const originalnameParts = (req.file?.originalname ?? '').split('.')

      const uploadedFile: any = await uploadFileToS3(
        req.file.buffer,
        userId,
        originalnameParts[originalnameParts.length - 1] ?? ''
      )

      if (uploadedFile?.Url) {
        attachment = uploadedFile?.Url
      }
    }

    const message = await insertMessage(doctorChat.doctor_chat_id, text, attachment, null)

    message.attachment = message.attachment
      ? `/minitulip/doctor-chat/attachment/${message.doctor_chat_message_id}`
      : null

    res.json({
      messageId: message.doctor_chat_message_id,
      chatRoomId: message.doctor_chat_id,
      text: message.text,
      attachment: message.attachment,
      sentAt: message.sent_at,
      repliedTo: null,
      doctorId: null,
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

export const postMessage = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const text = req.body.text

    let attachment = null

    const chatRoomId = parseInt(req.params.id ?? '0')

    const chatRoom = await getChatRoom(chatRoomId)

    if (!userId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    if (!text && !req.file) {
      return res.status(404).json({
        msg: 'You should send a text or an attachment.',
      })
    }

    if (req.file) {
      const originalnameParts = (req.file?.originalname ?? '').split('.')

      const uploadedFile: any = await uploadFileToS3(
        req.file.buffer,
        userId,
        originalnameParts[originalnameParts.length - 1] ?? ''
      )

      if (uploadedFile?.Url) {
        attachment = uploadedFile?.Url
      }
    }

    const message = await insertMessage(chatRoomId, text, attachment, null)

    await incrementReadRepliedCounts(chatRoomId)

    message.attachment = message.attachment
      ? `/minitulip/doctor-chat/attachment/${message.doctor_chat_message_id}`
      : null

    const doctorData = chatRoom.doctor_id ? (await getDoctorsData([chatRoom.doctor_id])) ?? null : null

    res.json({
      id: message.doctor_chat_message_id,
      chatRoomId: message.doctor_chat_id,
      text: message.text,
      attachment: message.attachment,
      sentAt: message.sent_at,
      doctorId: chatRoom.doctor_id,
      doctorName: doctorData ? doctorData[chatRoom.doctor_id]?.name : null,
      doctorProfileImage: doctorData ? doctorData[chatRoom.doctor_id]?.profileImage : null,
      doctorDesignation: doctorData ? doctorData[chatRoom.doctor_id]?.designation : null,
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

async function getDoctorName(doctorId: number) {
  return (await AdminUserModel.findOne({ where: { id: doctorId } }))?.name
}

async function incrementReadRepliedCounts(chatRoomId: number) {
  const chatRoom = await getChatRoom(chatRoomId)

  await DoctorChatModel.findOne({
    raw: true,
    where: {
      doctor_chat_id: chatRoomId,
    },
  })

  const updateData = {
    doctor_unread_messages: chatRoom.doctor_unread_messages + 1,
    doctor_unreplied_messages: chatRoom.doctor_unreplied_messages + 1,
  }

  await DoctorChatModel.update(updateData, {
    where: { doctor_chat_id: chatRoomId },
  })
}

export const doctorReply = async (req: Request, res: Response) => {
  try {
    const doctorId = getDoctorId(req)
    const text = req.body.text

    const chatRoomId = req.body.chatRoomId

    const repliedTo = parseInt(req.params.id ?? '0')

    let attachment = null

    if (!doctorId) {
      return res.status(404).json({
        msg: 'Unable to get user id.',
      })
    }

    if (!text && !req.file) {
      return res.status(404).json({
        msg: 'You should send a text or an attachment.',
      })
    }

    if (req.file) {
      const originalnameParts = (req.file?.originalname ?? '').split('.')

      const uploadedFile: any = await uploadFileToS3(
        req.file.buffer,
        doctorId,
        originalnameParts[originalnameParts.length - 1] ?? ''
      )

      if (uploadedFile?.Url) {
        attachment = uploadedFile?.Url
      }
    }

    await assignDoctor(chatRoomId, doctorId)
    const message = await insertDoctorMessage(chatRoomId, text, attachment, repliedTo, doctorId)

    message.attachment = message.attachment
      ? `/minitulip/doctor-chat/attachment/${message.doctor_chat_message_id}`
      : null

    const doctorsData = await getDoctorsData([doctorId])

    const userId = (await getChatRoom(chatRoomId))?.client_id

    const userName = (await getUserName(userId)) ?? 'USER NAME NOT FOUND'

    await updateDoctorChat(chatRoomId)

    await markAllDoctorsMessageReadReplied(chatRoomId)

    const userData = ((await getUsersProfileData(userId)) ?? {})[userId]

    await sendNotification(message.doctor_chat_message_id, message.text || 'Attachment', userData?.deviceToken, userId)

    res.json({
      id: message.doctor_chat_message_id,
      chatRoomId: message.doctor_chat_id,
      text: message.text,
      attachment: message.attachment,
      sentAt: message.sent_at,
      repliedTo: repliedTo || null,
      doctorId,
      doctorName: doctorsData[doctorId]?.name ?? '',
      doctorDesignation: doctorsData[doctorId]?.designation ?? '',
      doctorProfileImage: doctorsData[doctorId]?.profileImage ?? '',
      userId,
      userName,
      isClientMessage: false,
      isDoctorMessage: true,
      userProfileImage: userData && userData.profileImage ? userData.profileImage : null,
      userFirstName: userData && userData.firstName ? userData.firstName : null,
      userLastName: userData && userData.lastName ? userData.lastName : null,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      msg: 'INTERNAL ERROR',
    })
  }
}

async function sendNotification(id: string, body: string, token: string, userId: number) {
  try {
    if (!token) {
      return
    }

    const message = {
      data: {
        message: String(id),
        title: 'Doctor message',
        body,
      },
      android: {
        notification: {
          icon: 'ic_launcher',
          color: '#7e55c3',
        },
      },
      token,
    }

    await firebase.messaging().send(message)

    const notification = await NotificationModel.create({
      name: 'DOCTOR CHAT MESSAGE',
      title_html: 'Doctor message',
      description_html: body,
    })

    await notification.save()

    const userNotification = await UserNotificationModel.create({
      notification_id: notification.notification_id,
      user_id: userId,
      status: 'UNREAD',
    })

    await userNotification.save()
  } catch (err) {
    console.log(err)
  }
}

async function markAllDoctorsMessageReadReplied(chatRoomId: number) {
  const updateMessagesData = {
    read: true,
    replied: true,
  }

  await DoctorChatMessagesModel.update(updateMessagesData, {
    where: { doctor_chat_id: chatRoomId, doctor_id: null },
  })

  const updateChatData = {
    doctor_unread_messages: 0,
    doctor_unreplied_messages: 0,
  }

  await DoctorChatModel.update(updateChatData, {
    where: { doctor_chat_id: chatRoomId },
  })
}

async function updateDoctorChat(chatRoomId: number) {
  const doctorChat = await DoctorChatModel.findOne({
    raw: true,
    where: { doctor_chat_id: chatRoomId },
  })

  const updateData = {
    client_unread_messages: (doctorChat.client_unread_messages ?? 0) + 1,
    last_doctor_message_sent_at: new Date(),
  }

  await DoctorChatModel.update(updateData, {
    where: { doctor_chat_id: chatRoomId },
  })
}

async function assignDoctor(chatRoomId: number, doctorId: number) {
  const chat = await DoctorChatModel.findOne({
    raw: true,
    where: {
      doctor_chat_id: chatRoomId,
    },
  })

  if (!chat) {
    throw new Error('Unable to get chat')
  }

  if (!chat.doctor_id) {
    const updateData = {
      doctor_id: doctorId,
    }

    await DoctorChatModel.update(updateData, {
      where: { doctor_chat_id: chatRoomId },
    })
  } else {
    if (chat.doctor_id !== doctorId) {
      throw new Error('This chat has already been assigned to another doctor.')
    }
  }
}

export async function findAllMessages(doctorchatRoomId: number) {
  const messages = await DoctorChatMessagesModel.findAll({
    raw: true,
    where: {
      doctor_chat_id: doctorchatRoomId,
    },
  })

  if (!messages || !messages.length) {
    return []
  }

  const doctorsData = await getDoctorsData(_.uniq(messages.map((m: any) => m.doctor_id)))

  return messages.map((msg: any) => ({
    id: msg.doctor_chat_message_id,
    chatRoomId: msg.doctor_chat_id,
    text: msg.text,
    attachment: msg.attachment ? `/minitulip/doctor-chat/attachment/${msg.doctor_chat_message_id}` : null,
    attachmentFileName:
      msg.attachment && msg.attachment.length && msg.attachment.includes('/') ? msg.attachment.split('/').pop() : null,
    sentAt: msg.sent_at,
    doctorId: msg.doctor_id,
    doctorName: msg.doctor_id ? doctorsData[msg.doctor_id]?.name ?? '' : null,
    doctorProfileImage: msg.doctor_id ? doctorsData[msg.doctor_id]?.profileImage ?? '' : null,
    doctorDesignation: msg.doctor_id ? doctorsData[msg.doctor_id]?.designation ?? '' : null,
    repliedTo: msg.replied_to,
    isDoctorMessage: !!msg.doctor_id,
    isClientMessage: !msg.doctor_id,
    read: !!msg.read,
    replied: !!msg.replied,
  }))
}

async function markAllClientMessagesAsRead(chatRoomId: number) {
  await DoctorChatMessagesModel.update(
    { read: 1 },
    {
      where: { doctor_chat_id: chatRoomId, doctor_id: { [Op.eq]: null } },
    }
  )

  await DoctorChatModel.update(
    { client_unread_messages: 0 },
    {
      where: { doctor_chat_id: chatRoomId },
    }
  )
}

async function getDoctorsData(doctorsIds: Array<number>) {
  return ((await AdminUserModel.findAll({ raw: true, where: { id: doctorsIds } })) || []).reduce(
    (acc: any, curr: any) => {
      acc[curr.id] = {
        id: curr.id,
        name: curr.name,
        profileImage: curr.profile_image,
        designation: curr.designation,
      }
      return acc
    },
    {}
  )
}

async function getAttachmentURL(messageId: number) {
  const where: any = {
    doctor_chat_message_id: messageId,
  }

  return (
    await DoctorChatMessagesModel.findOne({
      where,
    })
  )?.attachment
}

async function getDoctorchatRoomIdsFromUserOrDoctor(
  userId: number | null | undefined,
  doctorId: number | null | undefined
) {
  if (userId) {
    return (
      (await DoctorChatModel.findAll({
        raw: true,
        where: {
          client_id: userId,
        },
      })) || []
    ).map((c: any) => c.doctor_chat_id)
  }

  if (doctorId) {
    return (
      (await DoctorChatModel.findAll({
        raw: true,
        where: {
          doctor_id: doctorId,
        },
      })) || []
    ).map((c: any) => c.doctor_chat_id)
  }
}

function getUserId(req: Request) {
  const token = (req.headers.authorization ?? '').replace('Bearer', '').trim()

  if (token) {
    try {
      const payload: any = verify(token, config.JWT_PRIVATE_KEY ?? ' ')
      return payload?.user_id ?? null
    } catch (err) {}
  }
}

export function getDoctorId(req: Request) {
  const token = (req.headers.authorization ?? '').replace('Bearer', '').trim()

  if (token) {
    try {
      const payload: any = verify(token, process.env.ADMIN_JWT_PRIVATE_KEY ?? ' ')

      return payload?.userId ?? null
    } catch (err) {}
  }
}

async function insertMessage(doctorChatRoomId: number, text: string, attachment: string, repliedTo: number | null) {
  const insert: any = {
    doctor_chat_id: doctorChatRoomId,
    text,
    attachment,
    sent_at: new Date(),
    replied_to: repliedTo || null,
    read: false,
    replied: false,
  }

  const message = new DoctorChatMessagesModel(insert)
  await message.save()

  return message.get({ plain: true })
}

async function insertDoctorMessage(
  doctorchatRoomId: number,
  text: string,
  attachment: string,
  repliedTo: number,
  doctorId: number
) {
  const insert: any = {
    doctor_chat_id: doctorchatRoomId,
    text,
    attachment,
    sent_at: new Date(),
    doctor_id: doctorId,
    replied_to: repliedTo || null,
    read: false,
    replied: false,
  }

  const message = new DoctorChatMessagesModel(insert)
  await message.save()

  return message.get({ plain: true })
}

async function initDoctorChat(userId: number) {
  const insert = {
    client_id: userId,
    last_client_message_sent_at: new Date(),
    last_doctor_message_sent_at: null,
    doctor_unread_messages: 1,
    doctor_unreplied_messages: 1,
    doctor_id: null,
  }

  const doctorChat = new DoctorChatModel(insert)
  await doctorChat.save()

  return doctorChat.get({ plain: true })
}

const uploadFileToS3 = (file: Buffer, userId: number, ext: string) => {
  const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  })

  const fileName = `${userId}_${Date.now()}.${ext}`
  return new Promise((resolve, reject) => {
    s3.putObject(
      { Bucket: process.env.SPACES_NAME ?? '', Key: fileName, ACL: 'private', Body: file },
      (err, data: any) => {
        if (err) {
          reject(err)
        } else {
          data.Url = `https://${process.env.SPACES_NAME}.${process.env.SPACES_ENDPOINT}/${fileName}`
          resolve(data)
        }
      }
    )
  })
}

const downloadFileFromS3 = (url: string) => {
  const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT ?? '')
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  })

  //   const contentType = mime.contentType(filePath)
  //   console.log('contentType', contentType)

  //   const ext = mime.extensions[contentType][0]
  return new Promise((resolve, reject) => {
    const urlParts = url.split('/')
    s3.getObject(
      { Bucket: process.env.SPACES_NAME ?? '', Key: urlParts[urlParts.length - 1] ?? '' },
      (err, data: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(data?.Body)

          // Uncommend this incase you want to get files with ACL = private
          // s3.getSignedUrl("getObject", { Bucket: process.env.S3_BUCKET_NAME, Key: fileName }, (err, url) => {
          //     if (err) {
          //         reject(err);
          //     } else {
          //         resolve({ Url: url, Etag: data.ETag });
          //     }
          // })
        }
      }
    )
  })
}
