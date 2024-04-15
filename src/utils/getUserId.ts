import UserModel from "../models/user/user"

export const getUserId = async(email: any) => {
    const user_info = await UserModel.findOne({
		raw: true,
		attributes: ["user_id"],
		where: {
			email: email.trim()
		},
	}).catch((error: any) => {
		return ""
	})

    if(!user_info) {
        return ""
    }

    return user_info.user_id
}