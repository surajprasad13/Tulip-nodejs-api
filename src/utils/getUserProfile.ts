import UserProfileModel from "../models/user/userProfile"

export const getUserProfile = async(user_id: any) => {
    const user_info = await UserProfileModel.findOne({
		raw: true,
		where: {
			user_id: user_id
		},
	}).catch((error: any) => {
		return ""
	})

    if(!user_info) {
        return ""
    }

    return user_info
}