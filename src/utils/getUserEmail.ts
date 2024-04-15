import UserModel from "../models/user/user"

export const getUserEmail = async(user_id: number) => {
    const user_info = await UserModel.findOne({
		raw: true,
		attributes: ["email"],
		where: {
			user_id: user_id
		},
	}).catch((error: any) => {
		return ""
	})

    if(!user_info) {
        return ""
    }

    return user_info.email
}