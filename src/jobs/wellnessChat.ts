import { EVERY_30_SECONDS, EVERY_5_SECONDS } from './../constants/ScheduleConstants'
import cron from 'node-cron'
import { EVERY_DAY, EVERY_MINUTE, EVERY_HOUR } from '../constants/ScheduleConstants'
import { calculateWellnessChatWaitingTime } from '../controllers/wellness-chat'
import firebase from '../config/firebase'
import { getUserEmail } from '../utils/getUserEmail'
import { sendAPIEmail } from '../helpers/sendEmail'
import { EmailCondition } from '../interfaces/email'

// cron.schedule(EVERY_MINUTE, async () => {
//   const chats: any[] = (
//     await firebase
//       .firestore()
//       .collection('wellness-advisor-chat')
//       .where('active', '==', true)
//       .where('wellnessAdvisorUnreadMessages', '==', 0)
//       .where('wellnessAdvisorUnrepliedMessages', '==', 0)
//       .get()
//   ).docs.map((doc) => ({ ...doc.data(), id: doc.id }))

//   for (const chat of chats) {
//     const date = new Date()
//     date.setSeconds(date.getSeconds() - 180)

//     const lastMessageSentAt =
//       chat.lastClientMessageSentAt.toDate() > chat.lastWellnessAdvisorMessageSentAt.toDate()
//         ? chat.lastClientMessageSentAt.toDate()
//         : chat.lastWellnessAdvisorMessageSentAt.toDate()

//     if (lastMessageSentAt < date) {
//       await firebase.firestore().collection('wellness-advisor-chat').doc(chat.id).update({
//         active: false,
//         closedAt: new Date(),
//         closedBy: null,
//         closedByType: 'inactivity',
//       })

//       const insert: any = {
//         text: 'Session closed due to inactivity ',
//         sentAt: new Date(),
//         read: true,
//         replied: true,
//         readAt: null,
//         repliedAt: null,
//         wellnessAdvisorId: chat.wellnessAdvisorId,
//         wellnessAdvisorName: chat.wellnessAdvisorName,
//         isFirstMessage: false,
//         isSessionClosingMessage: true,
//       }

//       const firebaseDoc = firebase
//         .firestore()
//         .collection('wellness-advisor-chat')
//         .doc(chat.id)
//         .collection('messages')
//         .doc()

//       await firebaseDoc.set(insert)

//       const email = await getUserEmail(chat.clientId)
//       const mails = [{
//         email: email,
//         name: chat.clientFirstName
//       }]
//       await sendAPIEmail(mails, EmailCondition.AdvisorChat)
//     }
//   }
// })

// cron.schedule(EVERY_HOUR, async () => {
//   try {
//     await calculateWellnessChatWaitingTime()
//   } catch (err) {
//     console.log(err)
//   }
// })
