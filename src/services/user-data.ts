import config from "../config"

enum UserDataFolder {
	TongueAnalysis = "tongue-analysis",
	Wearable = "wearable",
}

enum WearableDevice {
	Apple = "apple",
	Oura = "oura",
	fitbit = "fitbit",
}

const Personalization_Data_KeyFolder = `personalization`;
const TongueAnalysis_Data_KeyFolder = `tongue-analysis`;
const Wearable_Data_KeyFolder = `wearable`;

const userDataKey = (userId: string, data: UserDataFolder) => {
	var key = `${config.ENV}/userid=${userId}/typ=${data.toString()}`;
	return key;
}

const userWearableDataKey = (userId: string, device: WearableDevice) => {
	const key = `${userDataKey(userId, UserDataFolder.Wearable)}/device=${device.toString()}`;
	return key;
}

const userDataTongueAnalysisImageKey = (user_id: string, image_type: string) => {
	const key = `${config.ENV}/${user_id}/${TongueAnalysis_Data_KeyFolder}/image/${image_type}`;
	return key;
}

const userDataTongueAnalysisReportKey = (user_id: string) => {
	const key = `${config.ENV}/${user_id}/${TongueAnalysis_Data_KeyFolder}/tongue-analysis.json`;
	return key;
}

const userDataTongueAnalysisReportKey_withTime = (user_id: string) => {
	var t = new Date();
	let filename = `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}-${t.getHours()}-${t.getMinutes()}-${t.getSeconds()}.tongue-analysis.json`;

	const key = `${config.ENV}/${user_id}/${TongueAnalysis_Data_KeyFolder}/${filename}`;
	return key;
}

const userDataOpenAIdata = (user_id: string, tag: string) => {
	var t = new Date();
	let filename = `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}-${t.getHours()}-${t.getMinutes()}-${t.getSeconds()}.${tag}.raw.json`;

	const key = `${config.ENV}/${user_id}/${Personalization_Data_KeyFolder}/${filename}`;
	return key;
}

const userDataOpenAIdataLatest = (user_id: string, tag: string) => {
	var t = new Date();
	let filename = `latest.${tag}.raw.json`;

	const key = `${config.ENV}/${user_id}/${Personalization_Data_KeyFolder}/${filename}`;
	return key;
}

const userDataBucket = (userId: string, data: UserDataFolder) => {
	var bucket = `${config.ENV}/${userId}/${data.toString()}`;
	return bucket;
}

export {
	TongueAnalysis_Data_KeyFolder,
	Wearable_Data_KeyFolder,
	UserDataFolder,
	userDataKey,
	userDataBucket,
	userWearableDataKey,
	WearableDevice,
	userDataTongueAnalysisImageKey,
	userDataTongueAnalysisReportKey,
	userDataTongueAnalysisReportKey_withTime,
	userDataOpenAIdata,
	userDataOpenAIdataLatest
}
