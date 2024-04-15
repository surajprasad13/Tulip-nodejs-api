import { Request, Response } from "express"
import config from "../config"
import { UploadFileToS3Generic, GenerateSignedUrlGeneric, CopyS3Generic } from "../services/s3"
import { TongueAnalysis_Data_KeyFolder, userDataTongueAnalysisImageKey, userDataTongueAnalysisReportKey, userDataTongueAnalysisReportKey_withTime } from "../services/user-data"
import { ACL, BucketNames, SpaceName } from "../types/interface"
import * as gcp from '../services/gcp'
import { DoGetObject } from "../services/gcp"
import { NoSuchKey } from "@aws-sdk/client-s3"
import request from "supertest";

const sharp = require("sharp");
const replaceColor = require('replace-color')
var fs = require('fs')
const Jimp = require('jimp');

export const postUserImage = async (req: Request, res: Response) => {
	try {
		const user_id = res.locals.payload.user_id
		if (req.file) {
			const filename = req.file?.originalname
			const image_type = req.query.image_type as string
			const imageBinary = req.file?.buffer

			try {
				const extension = filename.split('.')[filename.split('.').length - 1];
				const key = userDataTongueAnalysisImageKey(user_id, image_type);
				var dataImage = await UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `image/${extension}`);

				GenerateSignedUrlGeneric(BucketNames.TulipUserData, key)
					.then((x: any) => {
						res.status(200).send({
							Url: x.Url,
							pre_register_session: res.locals.token
						});
					})
					.catch((error: any) =>
						res.status(500).send({ error })
					);

			} catch (error) {
				res.status(400).send({ error })
			}
		} else {
			res.status(500).send({ error: "file is missing" })
		}
	} catch (error) {
		console.log(error)
		res.status(500).send({ error: "INTERNAL ERROR" })
	}
}


const cropMouth = async (imageBuffer: Uint8Array) => {
	var api = config.AZURE_CV;
	var subs = config.AZURE_OCP_APIM_SUBSCRIPTION as string;
	var result: any = await request(api)
		.post("?features=denseCaptions,read&gender-neutral-caption=true&model-version=latest&language=en&api-version=2023-02-01-preview")
		.set('Content-Type', 'application/octet-stream')
		.set('Ocp-Apim-Subscription-Key', subs)
		.send(Buffer.from(imageBuffer));
	var rr = JSON.parse(result.res.text);
	if (result.res.statusCode != 200) {
		// console.log(result.res);
		// console.log('didnt find');
		return null;
	}
	// console.log(rr.denseCaptionsResult);
	var vals = rr.denseCaptionsResult.values;
	var cont = [];
	for (var v of vals) {
		// if (!/person/g.test(v.text))
		// 	continue;
		if (!/tongue/g.test(v.text))
			continue;
		if (!/close/g.test(v.text))
			continue;
		cont.push(v);
	}
	if (cont.length == 0) {
		// console.log('didnt find 0');
		// console.log(rr.denseCaptionsResult);
		return;
	}
	var u = cont[0].boundingBox;

	var img = await sharp(imageBuffer)
		.rotate()
		.extract({ left: u.x, top: u.y, width: u.w, height: u.h })
		.toBuffer();

	return img;
}

const areEqual = (first: Uint8Array, second: Uint8Array) =>
	first.length === second.length
    && first.every((value, index) => value === second[index]);

export const predictTongue = async (req: Request, res: Response) => {
	const user_id = res.locals.payload.user_id
	try {
		console.log('start' + new Date().toISOString());

		var keys = [];
		var waitAll = [];

		var cachedImages: any[] = [];

		// Compare images to see if any are the same
		for (var i = 0; i < 3; i++) {
			const k = userDataTongueAnalysisImageKey(user_id, `${i}`);
			console.log(k)
			var dos: any = DoGetObject('tulip-user-data', k).then((x) => { return x?.Body?.transformToByteArray() as Uint8Array; });
			cachedImages.push(dos);
		}
		cachedImages = await Promise.all(cachedImages);
		for (var i = 0; i < cachedImages.length; i++) {
			var contentFirst = await sharp(cachedImages[i]).toBuffer();
			for (var k = i + 1; k < cachedImages.length; k++) {
				var content = await sharp(cachedImages[k]).toBuffer();
				if (areEqual(contentFirst, content)) {
					console.log("THE SAME")
					return res.status(200).send({
						error: "Images uploaded are the same.",
						subErrorCode: 1
					})
				}
				console.log("not THE SAME")
			}
		}


		for (var i = 0; i < cachedImages.length; i++) {
			var content = cachedImages[i];
			console.log("Start AB")
			const key = userDataTongueAnalysisImageKey(user_id, `${i}`);
			keys.push(key);
			// var row = gcp.GcpTongueAnalysisGetPrediction(content);
			// waitAll.push(row);
			// console.log(`Pushed A ${i}.`);

			var cropped = cropMouth(content)
				.then(x => {
					if (x == null)
						return null;
					return gcp.GcpTongueAnalysisGetPrediction(x);
				})
			waitAll.push(cropped);
			console.log(`Pushed B ${i}.`);
		}

		var preds = await Promise.all(waitAll);
		console.log(`Waited and finished ${preds.length}.`);
		// console.log(preds)
		var preds2 = preds
			.filter((x: any) => x != null && x.conf.length > 0)
			.sort((a: any, b: any) => b.conf[0].numberValue - a.conf[0].numberValue);
		// console.log(preds2)
		// console.log(preds.length);
		// console.log(preds[0].conf[0]);
		// console.log(preds[1].conf[0]);
		var rows: any[] = [];
		if (preds2.length > 0)
			rows.push(preds2[0]);

		var cd = new Date();
		var report = {
			input: keys,
			prediction: rows,
			timestamp: cd,
			hasTongueAnalysis: true
		}

		const imageBinary = Buffer.from(JSON.stringify(report), "utf-8");
		// ${cd.getFullYear()}-${cd.getMonth()}-${cd.getDay()}
		const key = userDataTongueAnalysisReportKey(user_id);
		let key2 = userDataTongueAnalysisReportKey_withTime(user_id);
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key, `application/json`);
		UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, key2, `application/json`);
		console.log('end' + new Date().toISOString());
		res.status(200).send(report);

	} catch (error) {
		console.log(error)
		res.status(500).send({ error })
	}
}

export const getTongueReport = async (req: Request, res: Response) => {
	try {
		const user_id = res.locals.payload.user_id
		var bucket = 'tulip-user-data';
		const key = userDataTongueAnalysisReportKey(user_id);
		var doObject = await DoGetObject(bucket, key);
		var okk = await doObject?.Body?.transformToString();
		var content = JSON.parse(okk as string);
		res.status(200).send(content);
	} catch (error) {
		if (error instanceof NoSuchKey) {
			console.log("key not found")
			return res.status(200).send({ "hasTongueAnalysis": false });
		} else {
			console.log(error);
			return res.status(500).send({ error: "INTERNAL ERROR" });
		}
	}
}

export const getTongueReport2 = async (req: Request, res: Response) => {
	try {
		const user_id = req.body.payload.user_id
		var bucket = 'tulip-user-data';
		const key = userDataTongueAnalysisReportKey(user_id);
		var doObject = await DoGetObject(bucket, key);
		var report = await doObject?.Body?.transformToString();
		var content = JSON.parse(report as string);
		res.status(200).send(content);
	} catch (error) {
		if (error instanceof NoSuchKey) {
			console.log("key not found")
			return res.status(200).send({ "hasTongueAnalysis": false });
		} else {
			console.log(error);
			return res.status(500).send({ error: "INTERNAL ERROR" });
		}
	}
}

export const postTongueAnalysisTransfer = async (user_id: string, user_id_temp: string) => {
	// Transfer report
	var bucket = 'tulip-user-data';
	const key = userDataTongueAnalysisReportKey(user_id_temp);
	var doObject = await DoGetObject(bucket, key);
	var report = await doObject?.Body?.transformToString();

	const imageBinary = Buffer.from(JSON.stringify(report), "utf-8");
	const keyNew = userDataTongueAnalysisReportKey(user_id);
	var dataImage = await UploadFileToS3Generic(SpaceName.TulipUserData, ACL.private, imageBinary, keyNew, `application/json`);

	// Tranfer images
	for (var i = 0; i < 3; i++) {
		try {
			const keyImageOriginal = userDataTongueAnalysisImageKey(user_id_temp, String(i));
			const keyImageNew = userDataTongueAnalysisImageKey(user_id, String(i));
			await CopyS3Generic(SpaceName.TulipUserData, ACL.private, keyImageNew, SpaceName.TulipUserData, keyImageOriginal);
		} catch (error) {
			console.log(error)
		}
	}
}
